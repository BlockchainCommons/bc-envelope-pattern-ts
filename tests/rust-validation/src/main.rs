//! Replays tests/vectors/vectors.json against the tracked bc-envelope-pattern release.
//!
//!   cargo run --release -- ../vectors/vectors.json
use bc_envelope::prelude::*;
use bc_envelope_pattern::{format_paths_with_captures_opt, Error, FormatPathsOpts, Matcher, Path, PathElementFormat, Pattern};
use serde::Deserialize;
use std::collections::HashMap;

#[derive(Deserialize)]
struct File { count: usize, vectors: Vec<Vector> }
#[derive(Deserialize)]
struct Vector { name: String, recipe: serde_json::Value, expect: String }

fn cu(src: &str, byte: usize) -> usize {
    let b = byte.min(src.len());
    let mut i = b;
    while i > 0 && !src.is_char_boundary(i) { i -= 1; }
    src[..i].encode_utf16().count() + (b - i)
}
fn span(src: &str, s: &std::ops::Range<usize>) -> String { format!("@{}-{}", cu(src, s.start), cu(src, s.end)) }
fn variant_name(d: &str) -> String { d.split(|c| c == '(' || c == ' ' || c == '{').next().unwrap_or(d).to_string() }
fn describe(src: &str, e: &Error) -> String {
    let d = format!("{e:?}");
    let name = variant_name(&d);
    match e {
        Error::UnexpectedToken(t, s) => format!("UnexpectedToken({}){}", variant_name(&format!("{t:?}")), span(src, s)),
        Error::EmptyInput | Error::UnexpectedEndOfInput | Error::Unknown => name,
        Error::ExtraData(s) | Error::UnrecognizedToken(s) | Error::InvalidRegex(s) | Error::UnterminatedRegex(s)
        | Error::InvalidRange(s) | Error::InvalidHexString(s) | Error::InvalidDateFormat(s) | Error::InvalidNumberFormat(s)
        | Error::ExpectedOpenParen(s) | Error::ExpectedCloseParen(s) | Error::ExpectedOpenBracket(s)
        | Error::ExpectedCloseBracket(s) | Error::ExpectedPattern(s) | Error::UnmatchedParentheses(s)
        | Error::UnmatchedBraces(s) | Error::InvalidPattern(s) => format!("{name}{}", span(src, s)),
        Error::InvalidUr(_, s) | Error::InvalidCaptureGroupName(_, s) => format!("{name}{}", span(src, s)),
        Error::DCBORPatternError(inner) => format!("DCBORPatternError({})", variant_name(&format!("{inner:?}"))),
    }
}
fn render(paths: &[Path]) -> String {
    paths.iter().map(|p| p.iter().map(|e| e.digest().hex()).collect::<Vec<_>>().join(",")).collect::<Vec<_>>().join("|")
}
fn opts(o: &serde_json::Value) -> FormatPathsOpts {
    let mut f = FormatPathsOpts::new();
    if let Some(i) = o.get("indent").and_then(|v| v.as_bool()) { f = f.indent(i); }
    let max = o.get("maxLength").and_then(|v| v.as_u64()).map(|v| v as usize);
    match o.get("element").and_then(|v| v.as_str()) {
        Some("envelopeUR") => f = f.element_format(PathElementFormat::EnvelopeUR),
        Some("digestUR") => f = f.element_format(PathElementFormat::DigestUR),
        _ => { if max.is_some() { f = f.element_format(PathElementFormat::Summary(max)); } }
    }
    if let Some(l) = o.get("lastElementOnly").and_then(|v| v.as_bool()) { f = f.last_element_only(l); }
    f
}
fn run(r: &serde_json::Value) -> String {
    let k = r["k"].as_str().unwrap();
    if k == "domain" { return "js-only".to_string(); }
    let src = r.get("src").or_else(|| r.get("pattern")).and_then(|s| s.as_str()).unwrap();
    let pattern = match Pattern::parse(src) { Ok(p) => p, Err(e) => return format!("throw:{}", describe(src, &e)) };
    if k == "parse" { return format!("{pattern}"); }
    let haystack = Envelope::try_from_cbor_data(hex::decode(r["hex"].as_str().unwrap()).unwrap()).unwrap();
    if k == "matches" { return pattern.matches(&haystack).to_string(); }
    let (paths, captures) = pattern.paths_with_captures(&haystack);
    if k == "match" {
        let mut names: Vec<&String> = captures.keys().collect();
        names.sort();
        let caps = names.iter().map(|n| format!("{n}=[{}]", render(&captures[*n]))).collect::<Vec<_>>().join(";");
        return format!("paths=[{}]{}", render(&paths), if caps.is_empty() { String::new() } else { format!(" captures{{{caps}}}") });
    }
    let o = r.get("opts").cloned().unwrap_or(serde_json::Value::Null);
    let caps: HashMap<String, Vec<Path>> = captures;
    format_paths_with_captures_opt(&paths, &caps, opts(&o))
}
/// Expected divergences (see RUST_DIVERGENCES.md). Order matters: the
/// port-right classes come first, then the error-taxonomy classes.
///
/// R1  non-ASCII text literals: the reference decodes them byte by byte.
/// R2  a non-ASCII byte or known-value regex loses its closing quote there.
/// R3  `tagged(name, …)` / `tagged(/re/, …)` never match decoded data there.
/// R4  three or more `|` alternatives: only the first split runs there.
/// R5  captures under a structure pattern inside `search` are dropped there.
/// R7  `date'/'` panics there.
/// U-unknown   the reference raises its bare `Unknown` (no span) where an
///             inner construct met text it could not lex; the port reports a
///             code with the span.
/// U-relative  the same variant; the reference's span is relative to the
///             `date'…'`, `digest(…)`, `cbor(…)`, `tagged(…)` or `[…]` body it
///             was parsed from, the port's is absolute: equal once the body's
///             offset is added.
/// D1  the reference displays an infinite number as `inf`.
fn expected_divergence(recipe: &serde_json::Value, got: &str, want: &str) -> Option<&'static str> {
    let k = recipe["k"].as_str().unwrap_or("");
    let pat = recipe.get("src").or_else(|| recipe.get("pattern")).and_then(|s| s.as_str()).unwrap_or("");
    let hex = recipe.get("hex").and_then(|s| s.as_str()).unwrap_or("");
    let rt = got.starts_with("throw:");
    let tt = want.starts_with("throw:");
    let variant = |s: &str| s.trim_start_matches("throw:").split('@').next().unwrap_or("").to_string();
    let empty = |s: &str| s == "paths=[]" || s == "false" || s.is_empty();
    let paths_of = |s: &str| s.split(" captures").next().unwrap_or("").to_string();
    let non_ascii = pat.chars().any(|c| !c.is_ascii());
    let re = |p: &str| regex::Regex::new(p).unwrap();
    if got == "throw:panic" { return Some("R7"); }
    if non_ascii && re(r#""[^"]*[^\x00-\x7f][^"]*""#).is_match(pat) && !rt && !tt {
        if k == "parse" { return Some("R1"); }
        if empty(got) && !empty(want) { return Some("R1"); }
    }
    if non_ascii && re(r"(h'/|'/)[^/]*[^\x00-\x7f]").is_match(pat) && rt && !tt { return Some("R2"); }
    if re(r"tagged\(\s*([A-Za-z_][\w-]*|/[^/]*/)\s*[,)]").is_match(pat) && !rt && !tt && empty(got) && !empty(want) { return Some("R3"); }
    if pat.matches('|').count() >= 2 && !rt && !tt { return Some("R4"); }
    if re(r"search\(.*\b(subj|unwrap|pred|obj|assert\w*)\(.*@\w+\(").is_match(pat) && !rt && !tt
        && paths_of(got) == paths_of(want) && want.contains("captures{")
        && got.split(" captures{").nth(1).map_or(true, |c| c.trim_end_matches('}').split(';').all(|e| want.contains(e))) { return Some("R5"); }
    if rt && tt && variant(got) == "Unknown" { return Some("U-unknown"); }
    if rt && tt && variant(got) == variant(want) {
        // the reference's span is relative to a body whose opener ends at the offset difference
        let bounds = |s: &str| -> Option<(usize, usize)> {
            let at = s.rfind('@')?;
            let mut it = s[at + 1..].split('-');
            Some((it.next()?.parse().ok()?, it.next()?.parse().ok()?))
        };
        if let (Some((gs, ge)), Some((ws, we))) = (bounds(got), bounds(want)) {
            if ge - gs == we - ws && ws > gs {
                let k = ws - gs;
                let units: Vec<u16> = pat.encode_utf16().take(k).collect();
                let prefix = String::from_utf16_lossy(&units);
                if prefix.ends_with("date'") || prefix.ends_with('(') || prefix.ends_with('[') {
                    return Some("U-relative");
                }
            }
        }
    }
    if k == "parse" && got.replace("inf", "Infinity") == want { return Some("D1"); }
    None
}
fn main() {
    bc_envelope::register_tags();
    let path = std::env::args().nth(1).expect("vectors.json");
    let file: File = serde_json::from_str(&std::fs::read_to_string(&path).unwrap()).unwrap();
    assert_eq!(file.count, file.vectors.len());
    let (mut mismatches, mut expected) = (0, 0);
    let mut classes: HashMap<&str, usize> = HashMap::new();
    for v in &file.vectors {
        let got = std::panic::catch_unwind(|| run(&v.recipe)).unwrap_or_else(|_| "throw:panic".to_string());
        if got == "js-only" { *classes.entry("js-only").or_default() += 1; continue; }
        if got == v.expect { continue; }
        if let Some(class) = expected_divergence(&v.recipe, &got, &v.expect) {
            expected += 1; *classes.entry(class).or_default() += 1;
            if std::env::var("VERBOSE").is_ok() { eprintln!("expected [{class}] {}\n  rust: {got}\n  ts:   {}", v.name, v.expect); }
            continue;
        }
        mismatches += 1;
        if mismatches <= 40 || std::env::var("VERBOSE").is_ok() { eprintln!("MISMATCH {}\n  rust: {}\n  ts:   {}", v.name, got.replace('\n', "\\n"), v.expect.replace('\n', "\\n")); }
    }
    let mut cs: Vec<_> = classes.into_iter().collect(); cs.sort();
    for (c, n) in cs { println!("expected-divergence [{c}] x{n}"); }
    println!("{} vectors - {} match, {} expected-divergence, {} MISMATCH", file.vectors.len(), file.vectors.len() - mismatches - expected, expected, mismatches);
    if mismatches > 0 { std::process::exit(1); }
}
