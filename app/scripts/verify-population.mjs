import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

const baseUrl = process.env.FOLEGO_BASE_URL ?? "http://127.0.0.1:4179";
const output = process.env.FOLEGO_QA_OUTPUT_DIR;
const data = JSON.parse(await readFile(new URL("../public/data/population_debt.json", import.meta.url), "utf8"));
const formatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
const browser = await chromium.launch({ executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: true });
if (output) await mkdir(output, { recursive: true });
try {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    const section = page.locator(".population-section");
    await section.getByRole("heading", { name: "Como a dívida pesa na vida das pessoas?" }).waitFor();
    assert.match(await section.locator(".population-state-count").innerText(), /53/);
    assert.match(await section.locator(".population-state-answer").innerText(), /52,79%/);
    assert.match(await section.locator(".population-state-answer").innerText(), /51,32%/);
    assert.equal(await page.locator("#resumo-ceara").count(), 1);
    assert.match(await section.locator(".population-budget").innerText(), /41,8%/);
    assert.match(await section.locator(".population-budget-labels").innerText(), /418,00/);
    const reasons = section.locator("details").filter({ has: page.locator("summary", { hasText: "Que dívidas são essas" }) });
    await reasons.locator("summary").click();
    assert.match(await reasons.innerText(), /80,4%/);
    assert.match(await reasons.innerText(), /52,7%/);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    if (output) await section.screenshot({ path: resolve(output, `population-people-${width}.png`) });
    await section.getByRole("button", { name: "Renda e trabalho no Ceará Crédito por grupo de tomadores" }).click();
    const select = section.getByLabel("Renda mensal do tomador");
    for (const income of data.credit.incomes) {
      await select.selectOption(income);
      const visibleRows = section.locator("tbody tr");
      assert.equal(await visibleRows.count(), 4);
      const shownNames = await visibleRows.locator("th").allTextContents();
      for (let index = 0; index < shownNames.length; index++) {
        const raw = data.credit.cross.find((row) => row.income === income && row.occupation === shownNames[index]);
        assert.ok(raw, "Income and occupation must come from the same cell");
        assert.equal(await visibleRows.nth(index).locator("td").first().innerText(), raw.late_pct === null ? "Não disponível" : formatter.format(raw.late_pct));
      }
    }
    await select.selectOption("Mais de 1 a 2 salários mínimos");
    await section.getByRole("button", { name: "Ver todos os tipos de trabalho" }).click();
    assert.equal(await section.locator("tbody tr").count(), 8);
    await section.getByRole("rowheader", { name: "Outros", exact: true }).waitFor();
    await section.getByRole("button", { name: "Mostrar só os quatro grupos iniciais" }).click();
    assert.equal(await section.locator("tbody tr").count(), 4);
    await section.locator("summary", { hasText: "O que é esse crédito?" }).click();
    assert.equal(await section.locator(".population-product-list li").count(), 6);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    if (output) await section.screenshot({ path: resolve(output, `population-credit-${width}.png`) });
    assert.deepEqual(errors, []);
    await page.close();
  }
  const response = await fetch(`${baseUrl}/data/population_debt.json`);
  assert.equal(response.status, 200);
  const deployed = await response.json();
  assert.equal(deployed.credit.sha256, data.credit.sha256);
  assert.equal(deployed.registry.sha256, data.registry.sha256);
  console.log("Population flow verified: 4 viewports, 9 income brackets, 4/8 occupations, survey details, provenance and no horizontal overflow.");
} finally {
  await browser.close();
}
