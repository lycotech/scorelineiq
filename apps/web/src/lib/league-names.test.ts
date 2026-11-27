import { test } from "node:test";
import assert from "node:assert/strict";
import { isPlaceholderLeagueName, validateLeagueName } from "./league-names";

test("placeholder names are detected", () => {
  for (const n of ["League #1000001457", "league #110", "League 55", "League", "  ", "", null, undefined]) {
    assert.equal(isPlaceholderLeagueName(n), true, String(n));
  }
});

test("real names are not placeholders", () => {
  for (const n of ["Premier League", "Copa Libertadores", "Primera Division", "League One", "Ligue 1"]) {
    assert.equal(isPlaceholderLeagueName(n), false, n);
  }
});

test("validateLeagueName cleans whitespace and rejects placeholders", () => {
  assert.deepEqual(validateLeagueName("  Premier   League "), { name: "Premier League" });
  assert.ok("error" in validateLeagueName("League #938219"));
  assert.ok("error" in validateLeagueName(""));
  assert.ok("error" in validateLeagueName("ab"));
  assert.ok("error" in validateLeagueName("x".repeat(81)));
});
