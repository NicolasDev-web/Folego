import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputDirectory = resolve(scriptDirectory, "../../evidencias/qa");
const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const baseUrl = process.env.FOLEGO_BASE_URL ?? "http://127.0.0.1:5173";

const captures = [
  { name: "home-390.png", path: "/", width: 390, height: 844 },
  { name: "home-768.png", path: "/", width: 768, height: 900 },
  { name: "home-1440.png", path: "/", width: 1440, height: 900 },
  {
    name: "cidades-sobral-390.png",
    path: "/cidades?cidade=sobral",
    width: 390,
    height: 844,
  },
  {
    name: "cidades-sobral-1440.png",
    path: "/cidades?cidade=sobral",
    width: 1440,
    height: 900,
  },
  {
    name: "cidades-sobral-empregos-390.png",
    path: "/cidades?cidade=sobral",
    width: 390,
    height: 844,
    openEmployment: true,
  },
  {
    name: "cidades-sobral-empregos-1440.png",
    path: "/cidades?cidade=sobral",
    width: 1440,
    height: 900,
    openEmployment: true,
  },
];

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
});

try {
  for (const capture of captures) {
    const context = await browser.newContext({
      viewport: { width: capture.width, height: capture.height },
      colorScheme: "light",
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(`${baseUrl}${capture.path}`, { waitUntil: "networkidle" });
    if (pageErrors.length > 0) {
      throw new Error(`${capture.name}: ${pageErrors.join(" | ")}`);
    }
    if (capture.path.startsWith("/cidades")) {
      const shapeCount = await page.locator(".map-shape").count();
      if (shapeCount !== 184) {
        throw new Error(`${capture.name}: esperadas 184 geometrias; recebidas ${shapeCount}.`);
      }
    }
    if (capture.openEmployment) {
      await page.locator(".employment-details-trigger").click();
      const dialog = page.locator(".employment-dialog");
      await dialog.waitFor();
      const firstOccupation = await dialog
        .locator(".occupation-ranking li > div > span")
        .first()
        .textContent();
      if (firstOccupation !== "Trabalhador polivalente da confecção de calçados") {
        throw new Error(
          `${capture.name}: detalhamento ocupacional inesperado: ${firstOccupation ?? "vazio"}.`,
        );
      }
      await dialog.getByText("R$ 2.440,17", { exact: true }).waitFor();
    }
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    if (hasHorizontalOverflow) {
      throw new Error(`${capture.name}: a página possui rolagem horizontal.`);
    }
    await page.screenshot({
      path: resolve(outputDirectory, capture.name),
      fullPage: !capture.openEmployment,
    });
    if (capture.openEmployment) {
      await page.keyboard.press("Escape");
      await page.locator(".employment-dialog").waitFor({ state: "hidden" });
    }
    if (capture.name === "cidades-sobral-1440.png") {
      const fortalezaShape = page.locator(".map-shape").filter({ hasText: "Fortaleza" });
      await fortalezaShape.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, 140));
      const scrollBeforeSelection = await page.evaluate(() => window.scrollY);
      await fortalezaShape.click();
      await page.waitForURL(/cidade=fortaleza/);
      await page.locator(".coverage-heading h2", { hasText: "Fortaleza" }).waitFor();
      const scrollAfterSelection = await page.evaluate(() => window.scrollY);
      if (Math.abs(scrollAfterSelection - scrollBeforeSelection) > 2) {
        throw new Error(
          `Seleção alterou a rolagem: ${scrollBeforeSelection} → ${scrollAfterSelection}.`,
        );
      }
      const selectedName = await page.locator(".coverage-heading h2").textContent();
      if (selectedName !== "Fortaleza") {
        throw new Error(`Seleção do mapa não sincronizou: ${selectedName ?? "sem nome"}.`);
      }
      const mapLabel = await page.locator(".map-click-label strong").textContent();
      if (mapLabel !== "Fortaleza") {
        throw new Error(`Nome no mapa não sincronizou: ${mapLabel ?? "sem nome"}.`);
      }
      const search = page.getByRole("combobox", { name: "Buscar município" });
      await search.fill("Crato");
      await search.press("Enter");
      await page.waitForURL(/cidade=crato/);
      await page.locator(".coverage-heading h2", { hasText: "Crato" }).waitFor();
      const searchedName = await page.locator(".coverage-heading h2").textContent();
      if (searchedName !== "Crato") {
        throw new Error(`Busca não sincronizou: ${searchedName ?? "sem nome"}.`);
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}

