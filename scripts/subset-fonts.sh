#!/usr/bin/env bash
# Rebuild the self-hosted, subset fonts in src/assets/fonts from upstream.
#
# Not part of the build: the outputs are committed. Run it only to change the
# character set or the weights, and say so in docs/fonts.md.
#
# Needs Python 3 with fonttools and brotli (python3 -m pip install fonttools brotli).
# Usage: scripts/subset-fonts.sh <dir with the upstream variable TTFs>
#
# Upstream: github.com/google/fonts at commit 5bb28733cec313b63fbd415b574b5ae35c8aa8b8
#   ofl/sourcesans3/SourceSans3[wght].ttf, SourceSans3-Italic[wght].ttf, OFL.txt
#   ofl/jetbrainsmono/JetBrainsMono[wght].ttf, OFL.txt
set -euo pipefail

src="${1:?usage: scripts/subset-fonts.sh <upstream dir>}"
out="$(cd "$(dirname "$0")/.." && pwd)/src/assets/fonts"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
mkdir -p "$out/og"

# Basic Latin, Latin-1, the Windows-1252 extras, typographic punctuation,
# arrows, maths signs and the check and cross marks used in illustrations.
unicodes="U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+0160-0161,U+0178,U+017D-017E,\
U+02C6,U+02DA,U+02DC,U+2009-200A,U+2013-2014,U+2018-201A,U+201C-201E,U+2020-2022,\
U+2026,U+2030,U+2032-2033,U+2039-203A,U+2044,U+20AC,U+2122,U+2190-2193,U+2212,\
U+2215,U+2260,U+2264-2265,U+2713,U+2717"
features="kern,liga,calt,ccmp,locl,mark,mkmk,case,tnum,lnum,pnum"

instance() { # <variable font> <weight> <output ttf>
  python3 -m fontTools.varLib.instancer "$1" "wght=$2" --quiet -o "$3"
}

subset() { # <static ttf> <output> <flavor: woff2 | ttf> [extra args]
  local flavor_args=()
  if [ "$3" = "woff2" ]; then flavor_args=(--flavor=woff2); fi
  python3 -m fontTools.subset "$1" --unicodes="$unicodes" --layout-features="$features" \
    --no-hinting --desubroutinize --name-IDs='*' "${flavor_args[@]}" "${@:4}" \
    --output-file="$2"
}

instance "$src/sourcesans3__SourceSans3[wght].ttf" 400 "$tmp/ss-400.ttf"
instance "$src/sourcesans3__SourceSans3[wght].ttf" 600 "$tmp/ss-600.ttf"
instance "$src/sourcesans3__SourceSans3-Italic[wght].ttf" 400 "$tmp/ss-400i.ttf"
instance "$src/jetbrainsmono__JetBrainsMono[wght].ttf" 400 "$tmp/jb-400.ttf"

subset "$tmp/ss-400.ttf" "$out/source-sans-3-400.woff2" woff2
subset "$tmp/ss-600.ttf" "$out/source-sans-3-600.woff2" woff2
subset "$tmp/ss-400i.ttf" "$out/source-sans-3-400-italic.woff2" woff2
subset "$tmp/jb-400.ttf" "$out/jetbrains-mono-400.woff2" woff2

# The Open Graph image is rendered at build time by resvg, which reads TTF.
subset "$tmp/ss-400.ttf" "$out/og/source-sans-3-400.ttf" ttf
subset "$tmp/ss-600.ttf" "$out/og/source-sans-3-600.ttf" ttf
subset "$tmp/jb-400.ttf" "$out/og/jetbrains-mono-400.ttf" ttf

cp "$src/sourcesans3__OFL.txt" "$out/OFL-SourceSans3.txt"
cp "$src/jetbrainsmono__OFL.txt" "$out/OFL-JetBrainsMono.txt"

ls -l "$out" "$out/og"
