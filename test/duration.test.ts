import assert from "node:assert/strict";
import { test } from "node:test";
import { formatDuration, parseDuration } from "../src/duration.ts";

test("parses supported formats to seconds", () => {
  const cases: Record<string, number> = {
    "15m": 900,
    "1.75h": 6300,
    "1h 20m": 4800,
    "1h20m": 4800,
    "1:20": 4800,
    "0:05": 300,
    "90": 5400,
    "2h": 7200,
    ".5h": 1800,
    "45 min": 2700,
    "1 hour 5 mins": 3900,
    " 1H 20M ": 4800,
  };
  for (const [input, expected] of Object.entries(cases)) {
    assert.equal(parseDuration(input), expected, input);
  }
});

test("rejects garbage, zero, and over 24h", () => {
  for (const input of ["", "abc", "h", "m", "1x", "0", "0m", "1:60", "25h", "1h 20", "-15m"]) {
    assert.equal(parseDuration(input), undefined, input);
  }
});

test("formats seconds", () => {
  assert.equal(formatDuration(4800), "1h 20m");
  assert.equal(formatDuration(7200), "2h");
  assert.equal(formatDuration(900), "15m");
});
