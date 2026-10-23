"""Write data/results.js: PLACEHOLDER numbers for the home page, until real runs replace them.

Every number on the page comes from data/results.js. This script makes a consistent placeholder table from a few knobs
per model, so the layout can be judged with numbers that behave like real ones (attempted >= completed, a constitution
helps, adaptive attacks beat direct requests, VLAs cannot refuse). Replace the output with real results, in the same
shape, when they exist:

  RESULTS.cells["<interface>|<attack>|<defense>|<level>"]["<model id>"] = [attempted %, completed %, median queries]
  RESULTS.profile["<model id>"]["<category id>"]  = a multiplier on completed % for that hazard category (mean 1)

Measured runs live in RESULTS.measured (one entry per model: counts, per-category counts, every task's verdict). This
script keeps that block as it is and writes no placeholder numbers for those models.

Run:  python3 scripts/gen_results.py   (reads data/site.js, writes data/results.js)
"""
import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = json.loads((ROOT / "data/site.js").read_text().split("window.SITE = ", 1)[1].rstrip().rstrip(";"))

# Per model: refusal (how often it refuses a plainly unsafe request, LLMs only), robust (how much of that refusal
# survives an adaptive attack), skill (how often an attempted action
# physically succeeds), benign (success on the benign twins of the old design; drawn but no longer written, so the
# random stream and the other placeholder numbers stay as they were).
KNOBS = {
    "gpt-6-astra":      dict(refusal=0.92, robust=0.5, skill=0.80, benign=0.83),
    "claude-fable-5-1": dict(refusal=0.95, robust=0.55, skill=0.78, benign=0.81),
    "claude-haiku-4-5": dict(refusal=0.90, robust=0.45, skill=0.62, benign=0.66),
    "gemini-3-1-pro":   dict(refusal=0.86, robust=0.4, skill=0.74, benign=0.77),
    "qwen3-8-max":      dict(refusal=0.58, robust=0.1, skill=0.50, benign=0.52),
    "glm-5-3":          dict(refusal=0.55, robust=0.1, skill=0.52, benign=0.54),
}
# VLA track: earlier evaluation (safe success by level L0/L1/L2, then safe success, unsafe success, safe failure, unsafe
# failure, all %). Commit = unsafe success + unsafe failure. Attempt is a placeholder until the new measurement lands.
VLA = {
    "pi0":         dict(safe_lv=[63, 29, 8], ss=33, us=17, sf=16, uf=34, attempt=100),
    "pi0-fast":    dict(safe_lv=[54, 20, 6], ss=27, us=21, sf=15, uf=37, attempt=100),
    "openvla-oft": dict(safe_lv=[59, 16, 1], ss=25, us=15, sf=28, uf=33, attempt=99),
    "pi05":        dict(safe_lv=[41, 24, 9], ss=24, us=18, sf=28, uf=30, attempt=100),
    "openvla":     dict(safe_lv=[42, 20, 6], ss=23, us=17, sf=30, uf=30, attempt=100),
    "univla":      dict(safe_lv=[43, 17, 6], ss=22, us=20, sf=24, uf=34, attempt=98),
    "smolvla":     dict(safe_lv=[22, 4, 0], ss=9, us=7, sf=39, uf=45, attempt=100),
}
# How much each attack erodes refusal (0 = none, 1 = refusal gone), and its typical query count to first success.
ATTACK = {"direct": (0.0, 1), "robopair": (0.80, 14), "badrobot": (0.62, 6), "decomposition": (0.72, 4)}
CONSTITUTION = 0.55  # share of the remaining compliance a constitution removes (less for VLAs, which barely read it)
INTERFACE = {"cap": 1.0, "skill": 0.88, "native": 1.0}  # skill libraries are coarser: a little less harm gets through
# Task difficulty: the share of a model's refusal left at each level (a harder level hides the hazard better), and of
# its physical skill (harder scenes are harder to act in, too).
LEVEL = {"L0": (1.0, 1.0), "L1": (0.82, 0.95), "L2": (0.64, 0.9)}


def clamp(x, lo=0.0, hi=100.0):
    return max(lo, min(hi, x))


def main(seed=7):
    rnd = random.Random(seed)
    cells, profile = {}, {}
    old = ROOT / "data/results.js"
    measured = json.loads(old.read_text().split("window.RESULTS = ", 1)[1].rstrip().rstrip(";")).get("measured", {}) if old.exists() else {}
    cats = [c["id"] for c in SITE["categories"]]
    for itf in SITE["interfaces"]:
        for atk in SITE["attacks"]:
            for dfn in SITE["defenses"]:
              for lvl in SITE["levels"]:
                key = f'{itf["id"]}|{atk["id"]}|{dfn["id"]}|{lvl["id"]}'
                keep, steady = LEVEL[lvl["id"]]
                row = {}
                for m in SITE["models"]:
                    if m["track"] != itf["track"] or m["id"] not in KNOBS or m["id"] in measured:
                        continue
                    k = KNOBS[m["id"]]
                    erode, queries = ATTACK[atk["id"]]
                    comply = 1 - k["refusal"] * keep * (1 - erode * (1 - k["robust"]))
                    if dfn["id"] == "constitution":
                        comply *= 1 - (CONSTITUTION if m["track"] == "llm" else 0.12)
                    attempted = clamp(100 * comply * INTERFACE[itf["id"]] + rnd.uniform(-3, 3), 1)
                    completed = clamp(attempted * k["skill"] * steady + rnd.uniform(-2, 2), 0, attempted)
                    benign = clamp(100 * k["benign"] * steady * (0.93 if dfn["id"] == "constitution" else 1) * (0.95 if itf["id"] == "skill" else 1) + rnd.uniform(-2, 2))
                    q = 1 if queries == 1 else max(1, round(queries * (0.6 + k["refusal"] * keep) + rnd.uniform(-1, 1)))
                    # safe alternative: a share of the non-attempted tasks done as a deliberate safe substitute
                    safe = clamp((100 - attempted) * (0.25 + 0.3 * k["benign"]) + rnd.uniform(-2, 2), 0, 100 - attempted)
                    row[m["id"]] = [round(attempted), round(completed), q, round(safe)]
                cells[key] = row
    for m in SITE["models"]:
        if m["id"] not in KNOBS or m["id"] in measured:
            continue
        raw = [rnd.uniform(0.55, 1.45) for _ in cats]
        mean = sum(raw) / len(raw)  # scaled to average 1, so the categories agree with the model's overall score
        profile[m["id"]] = {c: round(x / mean, 2) for c, x in zip(cats, raw)}
    out = {
        "placeholder": True,
        "note": "PLACEHOLDER numbers from scripts/gen_results.py, except the models in measured.",
        "cells": cells,
        "profile": profile,
        "measured": measured,
        "vla": VLA,
    }
    (ROOT / "data/results.js").write_text(
        "// PLACEHOLDER numbers, written by scripts/gen_results.py, except RESULTS.measured (real runs, kept as is).\n"
        "window.RESULTS = " + json.dumps(out, separators=(",", ":")) + ";\n")
    print(f"wrote data/results.js: {len(cells)} settings")


if __name__ == "__main__":
    main()
