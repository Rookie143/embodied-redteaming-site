# Embodied Red Teaming: website template

A static home page for an embodied red-teaming benchmark: how safe foundation models are once they drive a robot,
for LLM / VLM agents (code-as-policies, skill planner) and VLA policies, under attacks and defenses.

**Status: template.** All numbers are placeholders, and so are all images and videos (see *Media* below).
A badge in the bottom-left corner says so; it goes away when `meta.placeholder` in `data/site.js` and
`placeholder` in `data/results.js` are both `false`.

## Run it

```
python3 -m http.server 8000      # then open http://localhost:8000
```

No build step. Plain HTML, CSS and JS; it also opens from `file://`.

## Where things live

| File | What it holds |
|---|---|
| `data/site.js` | All text, the models, attacks, defenses, interfaces, hazard categories, scenario media, the attack demo. Strict JSON after `window.SITE =`. |
| `data/results.js` | Every number in the leaderboard and heatmap. |
| `scripts/gen_results.py` | Writes `data/results.js` from a few knobs per model (refusal, robustness, skill, benign success). Placeholder only. |
| `index.html`, `leaderboard/`, `hazards/`, `attacks/`, `scenarios/`, `method/` | One page each. The home page shows a summary of every section and links to the full page. |
| `assets/app.js` | Fills whichever sections a page has: hero wall, counters, leaderboard, attack matrix, heatmap, hazard rows, attack player and cards, scene grid, loop figure. |
| `assets/exam.css` | The Embodied First Exam stylesheet, unchanged (MIT, see below). |
| `assets/redteam.css` | What this page adds: harm/safe colours, stacked bars, heatmap, attack player, loop figure. |

### Results format

```
RESULTS.cells["<interface>|<attack>|<defense>"]["<model id>"] = [attempted %, completed %, benign success %, median queries]
RESULTS.profile["<model id>"]["<category id>"] = multiplier on completed % for that hazard category
```

Interfaces: `cap`, `skill` (LLM / VLM track), `native` (VLA track). Attacks and defenses: the ids in `data/site.js`.
When real per-category numbers exist, replace `profile` with them directly (the heatmap and the drill-down read it).

The leaderboard ranks by completed attack success, lowest first. The heatmap shows the worst case over attacks, no defense.

## Media

Every image and video is a **placeholder** linked from the Embodied First Exam media set
(`huggingface.co/datasets/MLL-Lab/embodied-exam-media`, not copied into this repo): scenes of their safety suite,
their home-page wall and three suite teasers. Replace them with our own episode renders (a local `media/` folder or
our own Hugging Face dataset) before announcing the site; tiles are listed in `data/site.js` → `tiles`
(`kind: "unsafe"` tiles play on the open right side of the hero, `kind: "scene"` sit under the title).

## Credits

Layout, interaction design and `assets/exam.css` follow [Embodied First Exam](https://www.embodied-first-exam.ai/)
([repo](https://github.com/mll-lab-nu/embodied-first-exam)), MIT License, Copyright (c) 2026 Kangrui Wang and
Embodied First Exam contributors. The footer credits it; keep that line, and keep their license notice with `assets/exam.css`.
