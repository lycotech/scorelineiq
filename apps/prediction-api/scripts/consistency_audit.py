"""Grid audit of how often the published model figures contradict each other.

Run from apps/prediction-api:  python scripts/consistency_audit.py
See docs/CONSISTENCY_AUDIT.md for what the numbers mean.
"""
import itertools
import math
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app.models import elo, poisson  # noqa: E402


def predict(gf_h, ga_h, gf_a, ga_a, league, elo_h, elo_a):
    lam, mu = poisson.expected_goals(gf_h, ga_h, gf_a, ga_a, league)
    m = poisson.scoreline_matrix(lam, mu)
    ph, pd, pa = poisson.match_outcome_probabilities(m)
    h, d, a = elo.blend_with_elo(ph, pd, pa, elo_h, elo_a)
    best = poisson.top_correct_scores(m, 1)[0]
    return {
        "lam": lam, "mu": mu, "poisson": (ph, pd, pa), "blend": (h, d, a),
        "score": (best["home"], best["away"]),
        "o25": poisson.over_under_probability(m, 2.5),
        "btts": poisson.btts_probability(m),
        "eg": round(lam + mu, 2),
    }


def outcome(h, d, a):
    mx = max(h, d, a)
    return "H" if mx == h else ("D" if mx == d else "A")


def score_outcome(s):
    return "H" if s[0] > s[1] else ("D" if s[0] == s[1] else "A")


rows = []
for league in (1.2, 1.4, 1.6):
    rates = [0.7, 1.0, 1.4, 1.8, 2.2]
    for gf_h, ga_h, gf_a, ga_a in itertools.product(rates, repeat=4):
        # Elo roughly consistent with goal difference (strength-correlated)
        elo_h = 1500 + 150 * (gf_h - ga_h)
        elo_a = 1500 + 150 * (gf_a - ga_a)
        rows.append(predict(gf_h, ga_h, gf_a, ga_a, league, elo_h, elo_a))

n = len(rows)
print(f"grid size: {n} fixtures")


def pct(k):
    return f"{100 * k / n:.1f}%"


# A. predicted-score winner vs 1X2 favourite
a_mismatch = sum(1 for r in rows if score_outcome(r["score"]) != outcome(*r["blend"]))
print("A. predicted-score result != 1X2 favourite:", pct(a_mismatch))
a_draw = sum(1 for r in rows if score_outcome(r["score"]) == "D" and outcome(*r["blend"]) != "D")
print("   ...of which predicted score is a DRAW while a side is favourite:", pct(a_draw))
clear_fav = [r for r in rows if max(r["blend"]) >= 0.5]
print(f"   among clear favourites (>=50%), n={len(clear_fav)}: score contradicts favourite:",
      f"{100*sum(1 for r in clear_fav if score_outcome(r['score']) != outcome(*r['blend']))/len(clear_fav):.1f}%")
print(f"   among strong favourites (>=60%): score is a draw or other side:",
      f"{100*sum(1 for r in rows if max(r['blend'])>=0.6 and score_outcome(r['score']) != outcome(*r['blend']))/max(1,sum(1 for r in rows if max(r['blend'])>=0.6)):.1f}%")

# B. predicted score total vs Over/Under label
b_over_but_low = sum(1 for r in rows if r["o25"] >= 0.5 and sum(r["score"]) <= 2)
b_under_but_high = sum(1 for r in rows if r["o25"] < 0.5 and sum(r["score"]) >= 3)
print("B. 'Over 2.5' shown but predicted score has <=2 goals:", pct(b_over_but_low))
print("   'Under 2.5' shown but predicted score has >=3 goals:", pct(b_under_but_high))

# C. BTTS vs predicted score
c_btts_yes_but_clean = sum(1 for r in rows if r["btts"] >= 0.5 and 0 in r["score"])
c_btts_no_but_both = sum(1 for r in rows if r["btts"] < 0.5 and 0 not in r["score"])
print("C. BTTS >=50% but predicted score has a clean sheet:", pct(c_btts_yes_but_clean))
print("   BTTS <50% but predicted score has both teams scoring:", pct(c_btts_no_but_both))

# D. expected goals vs predicted score total
gaps = [abs(r["eg"] - sum(r["score"])) for r in rows]
print(f"D. |avg goals - predicted-score goals|: mean {sum(gaps)/n:.2f}, >=1.0 in {pct(sum(1 for g in gaps if g >= 1.0))}")
eg_hi_but_score_low = sum(1 for r in rows if r["eg"] >= 2.75 and sum(r["score"]) <= 2)
print("   avg goals >=2.75 but predicted score <=2 goals:", pct(eg_hi_but_score_low))

# E. Elo blend changes the favourite, but score/goals come from pure Poisson
e_flip = sum(1 for r in rows if outcome(*r["poisson"]) != outcome(*r["blend"]))
print("E. Elo blend flips the 1X2 favourite vs pure Poisson:", pct(e_flip))
# Elo is a deliberate 25% blend, so a flip only matters when the score is built from Poisson:
e_score_vs_poisson = sum(1 for r in rows if score_outcome(r["score"]) != outcome(*r["poisson"]))
print("   score result != pure-Poisson favourite:", pct(e_score_vs_poisson))

# F. home-advantage / league-average bias
print()
print("F. Average team vs average team (league avg per team per game):")
for league in (1.2, 1.4, 1.6):
    r = predict(league, league, league, league, league, 1500, 1500)
    true_total = 2 * league
    # P(total>2.5) if both sides scored at league average with no home edge
    pt = 1 - sum(poisson.poisson_pmf(k, true_total) for k in range(0, 3))
    print(f"   league {league}: model total {r['eg']:.2f} vs real league total {true_total:.2f} "
          f"(+{100*(r['eg']/true_total-1):.1f}%); O2.5 model {100*r['o25']:.0f}% vs league-average-Poisson {100*pt:.0f}%")
