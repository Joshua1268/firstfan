import { expect, test } from "./fixtures";
import { logIn, playSeededTest, seedOpenCampaign, uniqueEmail, validateSeededTest } from "./helpers";

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
});

test("a validated test fills the balance, and the tester withdraws it once", async ({ page, request }, testInfo) => {
  const email = uniqueEmail("testeuse-gains", testInfo);
  await seedOpenCampaign(request, email);
  await playSeededTest(request, email);
  const { invitationId } = await validateSeededTest(request, email);

  await logIn(page, email);
  await expect(page).toHaveURL(/\/testeur$/);
  await expect(page.getByTestId("home-balance")).toHaveText(/^3\s500 FCFA$/);

  await page.goto(`/testeur/invitations/${invitationId}`);
  await expect(page.getByRole("heading", { name: "Test validé" })).toBeVisible();
  await page.getByRole("link", { name: "Voir mes gains" }).click();
  await expect(page).toHaveURL(/\/testeur\/gains$/);
  await expect(page.getByRole("navigation").getByRole("link", { name: "Mes gains" })).toBeVisible();

  const balance = page.getByTestId("wallet-balance");
  await expect(balance).toHaveText(/^3\s500 FCFA$/);
  await expect(page.getByRole("listitem").filter({ hasText: "Compta Express" })).toContainText("+3");
  await expect(page.getByText("Versement sur le 07 •• •• •• 99")).toBeVisible();
  await expect(page.getByText("Aucun retrait pour l'instant.")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

  // More than the balance: the API refuses and says why, next to the field.
  const amount = page.getByLabel("Montant à retirer (FCFA)");
  await amount.fill("5000");
  await page.getByRole("button", { name: "Retirer" }).click();
  await expect(page.getByText("Montant supérieur à ton solde.")).toBeVisible();
  await expect(amount).toBeFocused();

  await amount.fill("3 500");
  await page.getByRole("button", { name: "Retirer" }).click();
  await expect(page.getByRole("status").filter({ hasText: "envoyé sur le 07 •• •• •• 99" })).toBeVisible();
  await expect(balance).toHaveText("0 FCFA");
  await expect(page.getByText("Rien à retirer pour l'instant.")).toBeVisible();
  await expect(page.getByRole("listitem").filter({ hasText: "07 •• •• •• 99" })).toContainText("Versé");

  // The balance is empty: a second withdrawal is refused.
  const csrf = (await page.context().cookies()).find((c) => c.name === "csrftoken")?.value ?? "";
  const again = await page.request.post("/api/tester/withdrawals/", {
    data: { amount_xof: 3500 },
    headers: { "X-CSRFToken": csrf },
  });
  expect(again.status()).toBe(400);
  expect(await again.json()).toEqual({ amount_xof: ["Montant supérieur à ton solde."] });
  await page.reload();
  await expect(balance).toHaveText("0 FCFA");
  await expect(page.getByRole("listitem").filter({ hasText: "07 •• •• •• 99" })).toHaveCount(1);
});
