import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CURRENCY = String.raw`(?:fcfa|cfa|xof|francs?|euros?|dollars?|€|\$(?!\{)|f|k)`;
const NUM = String.raw`\d{1,3}(?:[   .,]\d{3})+|\d+`;

// No letter or digit after the currency, so hashes and hex colors are not amounts.
const RULES = [
  {
    rule: "amount",
    re: new RegExp(
      String.raw`(?<![\p{L}\p{N}])(?:${NUM})[   ]?${CURRENCY}(?![\p{L}\p{N}])|[€$][   ]?(?:${NUM})`,
      "giu",
    ),
  },
  { rule: "emoji", re: /(?![\u00a9\u00ae\u2122])\p{Extended_Pictographic}/gu },
  { rule: "arrow", re: /[\u2190-\u21ff\u27f0-\u27ff\u2900-\u297f]/gu },
  { rule: "premier", re: /(?<!\p{L})premi(?:er|ère|ers|ères)(?!\p{L})/giu },
];

export function scan(text) {
  const found = [];
  for (const { rule, re } of RULES) {
    for (const m of text.matchAll(re)) found.push({ rule, match: m[0], index: m.index });
  }
  return found.sort((a, b) => a.index - b.index);
}

const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".html", ".mdx"]);

// Logged-in areas: amounts are allowed there.
const PRIVATE_ROUTES = new Set(["src/app/dev", "src/app/testeur", "src/app/paiement"]);

function* walk(path) {
  if (PRIVATE_ROUTES.has(path)) return;
  if (statSync(path).isDirectory()) {
    for (const entry of readdirSync(path)) yield* walk(join(path, entry));
  } else if (EXTENSIONS.has(extname(path))) {
    yield path;
  }
}

function main(targets) {
  let failures = 0;
  for (const target of targets) {
    if (!existsSync(target)) {
      console.warn(`ignoré (introuvable) : ${target}`);
      continue;
    }
    for (const file of walk(target)) {
      readFileSync(file, "utf8")
        .split("\n")
        .forEach((line, i) => {
          for (const f of scan(line)) {
            failures += 1;
            console.log(`${file}:${i + 1}:${f.rule} (${f.match})`);
          }
        });
    }
  }
  if (failures > 0) process.exit(1);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  main(args.length > 0 ? args : ["src/features/landing", "src/features/testers-landing", "src/ui", "src/app"]);
}
