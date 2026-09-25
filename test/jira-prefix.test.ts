import assert from "node:assert/strict";
import { test } from "node:test";
import { jiraPrefixFrom } from "../src/jira-prefix.ts";

test("reads the connection prefix from Jira-linked project IDs", () => {
  assert.equal(jiraPrefixFrom(["ev:123", "jr:8558-10028", "jr:8558-10201", "as:99"]), "jr:8558");
});

test("rejects no Jira projects", () => {
  assert.throws(() => jiraPrefixFrom(["ev:123", "as:99"]), /No Jira-connected projects/);
});

test("rejects multiple Jira connections", () => {
  assert.throws(() => jiraPrefixFrom(["jr:8558-10028", "jr:9000-10001"]), /Multiple Everhour Jira connections/);
});
