import { test } from "node:test";
import assert from "node:assert/strict";
import { scan } from "./check-content.mjs";

test("flags amounts", () => assert.deepEqual(scan("Gagne 5 000 FCFA").map((f) => f.rule), ["amount"]));
test("flags 5000f", () => assert.equal(scan("5000f par test")[0].rule, "amount"));
test("flags premier", () => assert.equal(scan("Le premier en Afrique")[0].rule, "premier"));
test("flags unicode arrow", () => assert.equal(scan("Voir →")[0].rule, "arrow"));
test("flags emoji", () => assert.equal(scan("Top \u{1F680}")[0].rule, "emoji"));
test("passes clean copy", () => assert.deepEqual(scan("Testeurs payés après validation, par Wave."), []));
test("J7 and 4,8 / 5 are not amounts", () =>
  assert.deepEqual(scan("Toujours là à J7 · 4,8 / 5 · 14 captures"), []));
test("date and 'fois' are not amounts", () => {
  assert.deepEqual(scan("le 12 février"), []);
  assert.deepEqual(scan("5 fois"), []);
});
