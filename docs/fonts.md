# Fonts

Two families, both under the SIL Open Font License 1.1, self-hosted from `src/assets/fonts/` (licences: `OFL-SourceSans3.txt`, `OFL-JetBrainsMono.txt` beside the files). Nothing is loaded from another site.

| File | Family | Weight | Size | Use |
| --- | --- | --- | ---: | --- |
| `source-sans-3-400.woff2` | Source Sans 3 | 400 | 13 KB | body text; the only preloaded font |
| `source-sans-3-400-italic.woff2` | Source Sans 3 | 400 italic | 13 KB | emphasis; loads when used |
| `source-sans-3-600.woff2` | Source Sans 3 | 600 | 13 KB | headings, labels, buttons; loads when used |
| `jetbrains-mono-400.woff2` | JetBrains Mono | 400 | 20 KB | code and identifiers; loads when used |
| `og/*.ttf` | both | 400, 600 | | Open Graph image only (resvg reads TTF); never served |

All faces use `font-display: swap`. `src/styles/fonts.css` also defines metric-matched fallbacks (Arial or Liberation Sans for Source Sans 3, Courier New or Liberation Mono for JetBrains Mono), so the page does not shift when the web font arrives.

## How the files were made

`scripts/subset-fonts.sh` rebuilds them from the variable fonts in google/fonts at commit `5bb28733cec313b63fbd415b574b5ae35c8aa8b8` (`ofl/sourcesans3`, `ofl/jetbrainsmono`): each weight is instanced from the variable font with fontTools, then subset, unhinted, to WOFF2.

Character set: Basic Latin, Latin-1, the Windows-1252 extras (Œ, Š, Ÿ, Ž and their lower case), typographic quotes and dashes, ellipsis, bullet, primes, euro, trade mark, arrows (← ↑ → ↓), minus, ≠ ≤ ≥, and ✓ ✗. Layout features kept: `kern liga calt ccmp locl mark mkmk case tnum lnum pnum`.

A character outside the set falls back to the system font. To add one, edit the `unicodes` list in the script, run it with the upstream files, and update this page.

## Fallback metrics

Measured with fontTools against the average advance width of an English sample sentence:

- Source Sans 3 on Arial: `size-adjust: 92.85%`, `ascent-override: 110.29%`, `descent-override: 43.08%`.
- JetBrains Mono on Courier New: same advance width (0.6 em), so `size-adjust: 100%`, `ascent-override: 102%`, `descent-override: 30%`.
