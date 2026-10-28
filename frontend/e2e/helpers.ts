import { execFileSync } from "node:child_process";
import { expect, type APIRequestContext, type Page } from "@playwright/test";

type Box = { x: number; y: number; width: number; height: number } | null;

export type Finding = { rule: string; match: string; index: number };

// Dynamic import: Playwright compiles specs to CommonJS, the script is an ES module.
export async function scan(text: string): Promise<Finding[]> {
  const mod = (await import("../scripts/check-content.mjs")) as { scan: (t: string) => Finding[] };
  return mod.scan(text);
}

// Touching edges do not count as an overlap.
export function overlaps(a: Box, b: Box): boolean {
  if (!a || !b) return false;
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

// Scrolls so the raw stage progress equals p; the smoothed progress catches up afterwards.
export async function scrollStageTo(page: Page, p: number) {
  await waitForLiveStage(page);
  await page.evaluate((target) => {
    const stage = document.querySelector<HTMLElement>("[data-stage]");
    if (!stage) throw new Error("stage not found");
    const top = stage.getBoundingClientRect().top + window.scrollY;
    const range = stage.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + target * range, behavior: "instant" });
  }, p);
}

// The animated stage loads after hydration; never use this with reduced motion, where it never loads.
export async function waitForLiveStage(page: Page) {
  await page.locator("[data-stage-loaded]").waitFor({ state: "attached", timeout: 15_000 });
}

export const PASSWORD = "Sol1de-pass!";

export function uniqueEmail(prefix: string, testInfo: { project: { name: string } }) {
  return `${prefix}-${testInfo.project.name}-${Date.now()}@e2e.test`;
}

export async function signUpDev(page: Page, email: string) {
  await page.goto("/inscription?role=dev");
  await page.getByLabel("Prénom").fill("Awa");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await expect(page).toHaveURL(/\/dev$/);
}

// Smallest valid PNG (1 x 1 pixel): the API checks the first bytes of every capture.
export const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

// Uses the e2e_tester command of the Docker backend (DEBUG only): the tester is verified and available.
// With a password, the tester can also log in.
export function createVerifiedTester(email: string, profession: string, password?: string) {
  const args = ["compose", "exec", "-T", "backend", "uv", "run", "python", "manage.py", "e2e_tester"];
  args.push("--email", email, "--profession", profession);
  if (password) args.push("--password", password);
  execFileSync("docker", args);
}

export const SCENARIO = [
  "Crée une facture pour un client",
  "Ajoute une dépense avec son justificatif",
  "Exporte le bilan du mois",
];

// Django rotates the CSRF token at login: read the cookie again before every write.
async function postAs(
  request: APIRequestContext,
  path: string,
  options: { data?: unknown; multipart?: Record<string, string> },
) {
  const { cookies } = await request.storageState();
  const token = cookies.find((c) => c.name === "csrftoken")?.value ?? "";
  const res = await request.post(path, { ...options, headers: { "X-CSRFToken": token } });
  expect(res.ok(), `${path}: ${await res.text()}`).toBe(true);
  return res.status() === 204 ? null : res.json();
}

// A verified tester (who can log in with PASSWORD) and a dev whose paid campaign invites them.
export async function seedOpenCampaign(request: APIRequestContext, testerEmail: string) {
  createVerifiedTester(testerEmail, "Comptable", PASSWORD);
  await request.get("/api/auth/csrf/");
  await postAs(request, "/api/auth/register/", {
    data: { email: `dev-${testerEmail}`, password: PASSWORD, first_name: "Awa", role: "dev" },
  });
  const project = await postAs(request, "/api/projects/", {
    multipart: { name: "Compta Express", url: "https://compta.example/app", description: "Factures et dépenses." },
  });
  const campaign = await postAs(request, `/api/projects/${project.id}/campaigns/`, {
    data: { target_profession: "Comptable", testers_wanted: 1, steps: SCENARIO },
  });
  const { candidates } = await (await request.get(`/api/campaigns/${campaign.id}/testers/`)).json();
  const name = testerEmail.split("@")[0].toLowerCase();
  const tester = candidates.find((c: { first_name: string }) => c.first_name.toLowerCase() === name);
  await postAs(request, `/api/campaigns/${campaign.id}/selection/`, { data: { tester_ids: [tester.id] } });
  const { reference } = await postAs(request, `/api/campaigns/${campaign.id}/checkout/`, {});
  await postAs(request, `/api/payments/${reference}/simulate/`, { data: { outcome: "paid" } });
}

export async function logIn(page: Page, email: string) {
  await page.goto("/connexion");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
}
