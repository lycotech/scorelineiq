"""Random-input audit of Elo flips, rounding and wording mismatches.

Run from apps/prediction-api:  python scripts/consistency_audit_rounding.py
See docs/CONSISTENCY_AUDIT.md for what the numbers mean.
"""
import itertools
import math
import random
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app.models import elo, poisson  # noqa: E402

random.seed(7)


def js_round(x):  # JS Math.round semantics for positive numbers
    return math.floor(x + 0.5)


def js_tofixed0(x):
    return str(js_round(x))


rows = []
for _ in range(20000):
    league = random.uniform(1.1, 1.7)
    gf_h, ga_h, gf_a, ga_a = (random.uniform(0.6, 2.3) for _ in range(4))
    # independent Elo: promotion / injuries / form shifts since the stats window
    elo_h, elo_a = random.gauss(1500, 120), random.gauss(1500, 120)
    lam, mu = poisson.expected_goals(gf_h, ga_h, gf_a, ga_a, league)
    m = poisson.scoreline_matrix(lam, mu)
    p = poisson.match_outcome_probabilities(m)
    b = elo.blend_with_elo(*p, elo_h, elo_a)
    rows.append((p, b, round(max(b) * 100, 1)))

n = len(rows)
flip = sum(1 for p, b, _ in rows if p.index(max(p)) != b.index(max(b)))
print(f"E2. independent Elo (+-120): Elo blend flips the 1X2 favourite vs pure Poisson in {100*flip/n:.1f}% of fixtures")

sum_bad = sum(1 for p, b, _ in rows if sum(js_round(x * 100) for x in b) != 100)
print(f"J. rounded H/D/A percentages do not sum to 100 in {100*sum_bad/n:.1f}% of fixtures")

conf_bad = sum(1 for p, b, c in rows if int(js_tofixed0(c)) != js_round(max(b) * 100))
print(f"G2. 'Confidence' card (stored 1-dp value, toFixed(0)) != the favourite's bar % in {100*conf_bad/n:.1f}% of fixtures")

# G3. tier wording: narrative vs table
def narr(top):
    return "heavily" if top >= 0.6 else ("favourite" if top >= 0.45 else "open")


def tier(conf):
    return "High" if conf >= 70 else ("Moderate" if conf >= 50 else "Close")

from collections import Counter
c = Counter()
for p, b, conf in rows:
    top = max(b)
    if b.index(top) == 1:
        continue
    c[(narr(top), tier(conf))] += 1
print("G3. wording pairs (narrative lean vs table tier), share of non-draw-favourite fixtures:")
tot = sum(c.values())
for k, v in sorted(c.items(), key=lambda kv: -kv[1]):
    print(f"    narrative '{k[0]}' + table '{k[1]} confidence': {100*v/tot:.1f}%")

# H. narrative BTTS contradiction
rows2 = []
for _ in range(20000):
    league = random.uniform(1.1, 1.7)
    gf_h, ga_h, gf_a, ga_a = (random.uniform(0.6, 2.3) for _ in range(4))
    lam, mu = poisson.expected_goals(gf_h, ga_h, gf_a, ga_a, league)
    m = poisson.scoreline_matrix(lam, mu)
    rows2.append((poisson.over_under_probability(m, 2.5), poisson.btts_probability(m)))
hi = [(o, b) for o, b in rows2 if o >= 0.65]
bad = sum(1 for o, b in hi if b < 0.5)
print(f"H. narrative says 'Both teams are expected to contribute' (over2.5>=65%) while BTTS<50%: {100*bad/len(hi):.1f}% of those fixtures")
