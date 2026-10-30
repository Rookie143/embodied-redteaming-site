# Embodied Red Teaming: website template

A static home page for an embodied red-teaming benchmark: how safe foundation models are once they drive a robot,
for LLM / VLM agents (code-as-policies, skill planner) and VLA policies, under attacks and defenses.

**Status:** the LLM / VLM track shows measured results (round of 2026-10-30: 7 models x 4 attacks, with and without
the safety constitution, by level and by hazard category, plus the benign over-refusal check). The VLA track's attempt
rates and all scene images and videos are still placeholders; a small "Preview" badge in the corner says so.

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
RESULTS.measured["<model id>"].conditions["<attack>|<defense>"] = {
  itf: "cap",
  levels: { "L0": { a: [k, 13], c: [k, 13], s: [k, 13], u: [ua, uc, us] }, "L1": {..., 37}, "L2": {..., 12} },
  by_cat: { "<category id>": [tasks, attempted | null, commit, safe | null] }      // base 50 tasks
}
RESULTS.vla["<model id>"] = { us, uf, ss, sf, safe_lv, attempt }                   // VLA track; commit = us + uf
RESULTS.checks.rows = [[title, text], ...]                                          // Method page, validity checks
```

Metrics: **Attempted** (the program performs the harmful action), **Commit** (shown as Completed: the simulator's
hazard predicate fired) and **Safe Alternative** (a safe substitute action was carried out). A failed safe alternative
that still triggers the hazard counts as Commit and Safe Alternative but not Attempted, so Commit can exceed Attempted.

Denominators are fixed task counts: L0 13, L1 37, L2 12. "All" on the site is the base 50 (L0 + L1); L2 is reported on
its own. A level with any undecided input (`u` above 0) shows "In progress" instead of rates, and "All" needs both L0 and
L1 complete. Category numbers cover the base 50 tasks.

The leaderboard ranks by commit, lowest first. The heatmap shows, for each model, its strongest attack with no defense.
New result tables are entered by hand into `data/results.js` in this shape and checked against the totals they come with.

## Star ratings

`data/site.js` → `rating`: a model's score is its mean commit rate over the attacks it has complete results for,
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
