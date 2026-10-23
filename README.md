# Embodied Red Teaming: website template

A static home page for an embodied red-teaming benchmark: how safe foundation models are once they drive a robot,
for LLM / VLM agents (code-as-policies, skill planner) and VLA policies, under attacks and defenses.

**Status: template.** All numbers are placeholders, and so are all images and videos (see *Media* below).
A badge in the bottom-right corner says so; it goes away when `meta.placeholder` in `data/site.js` and
`placeholder` in `data/results.js` are both `false`.

Live site: https://rookie143.github.io/embodied-redteaming-site/

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
| `scripts/gen_results.py` | Writes `data/results.js` from a few knobs per model (refusal, robustness, skill). Placeholder only; it keeps `RESULTS.measured` as is. |
| `index.html`, `leaderboard/`, `compare/`, `hazards/`, `attacks/`, `scenarios/`, `method/` | One page each. The home page shows a summary of every section and links to the full page. |
| `model/?id=<model id>` | One model's safety report: star rating, worst category, breakdowns, share card, comments. |
| `assets/app.js` | Fills whichever sections a page has: the hero's scene plane and the band of it under each inner page's title, counters, leaderboard, attack matrix, heatmap, hazard rows, attack player and cards, scene grid, loop figure, share card. |
| `assets/site.css` | The whole look, one light theme: palette (harm red, safe teal), Sora / DM Sans / IBM Plex Mono, the bar, cards, controls, the perspective scene plane and every section. |

### Results format

```
RESULTS.cells["<interface>|<attack>|<defense>|<level>"]["<model id>"] = [attempted %, completed %, median queries]
RESULTS.profile["<model id>"]["<category id>"] = multiplier on completed % for that hazard category
RESULTS.measured["<model id>"] = { batch, date, runtime, setup, itf, attack, defense, n, attempted, completed,
                                   by_cat: { "<category id>": [tasks, attempted, completed] },
                                   tasks: [[category id, task id, instruction, "completed" | "attempted" | "refused"]], notes }
```

Three metrics: **Attempted** (the model did not refuse: its program tries the harmful action), **Completed** (the
simulator's hazard predicate fired) and **Completed ÷ Attempted**. There are no benign twins in the current design.

A measured run (`RESULTS.measured`) joins the table as the cell `<itf>|<attack>|<defense>` (no level), and its
per-category numbers and task list come straight from the counts; its model report lists every task with its verdict.
Measured so far: GPT-5.6 Sol, Safety50 diagnostic batch of 2026-10-22 (direct instructions, no defense, CaP-X).
Every other number is still a placeholder. Settings flagged `"soon": true` in `data/site.js` (attacks other than Direct,
the constitution, the skill planner) are shown as "coming soon".

Interfaces: `cap`, `skill` (LLM / VLM track), `native` (VLA track). Attacks, defenses and levels (`L0`–`L2`): the ids in `data/site.js`.
The cell key is `<interface>|<attack>|<defense>|<level>`; the site averages the levels for "All".
When real per-category numbers exist, replace `profile` with them directly (the heatmap and the drill-down read it).

The leaderboard ranks by completed attack success, lowest first. The heatmap shows the worst case over attacks, no defense.

## Star ratings

`data/site.js` → `rating`: a model's score is its mean completed attack success over every attack it has been run under,
with no defense, and `stars` maps the score to 1–5 stars (`max` is exclusive). Companies are rated by their safest model.

## Comments (Giscus)

Each model report and each comparison gets its own thread on GitHub Discussions; reactions on it act as votes.
To switch them on:

1. Repo Settings → General → Features → tick **Discussions**, and create a category named `Leaderboard`
   (type: Announcement, so only maintainers can start threads; Giscus creates them).
2. Install the Giscus app on this repository: https://github.com/apps/giscus
3. Open https://giscus.app, enter `Rookie143/embodied-redteaming-site`, pick the `Leaderboard` category, and copy the
   `data-category-id` value into `data/site.js` → `comments.categoryId` (`repoId` is already filled in).

Until then each page shows "Comments open at launch".

## Media

Every image and video is a **placeholder** linked from the Embodied First Exam media set
(`huggingface.co/datasets/MLL-Lab/embodied-exam-media`, not copied into this repo): scenes of their safety suite,
their home-page wall and three suite teasers. Replace them with our own episode renders (a local `media/` folder or
our own Hugging Face dataset) before announcing the site; tiles are listed in `data/site.js` → `tiles`
(`kind: "unsafe"` tiles make up most of the hero's scene plane and the near ones play; `kind: "scene"` tiles are mixed in).

## Credits

Template adapted from [Embodied First Exam](https://www.embodied-first-exam.ai/) (MIT); its license is in assets/LICENSE-embodied-first-exam.
