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
  { name: "metodo-390.png", path: "/metodo", width: 390, height: 844 },
  { name: "metodo-768.png", path: "/metodo", width: 768, height: 900 },
  { name: "metodo-1440.png", path: "/metodo", width: 1440, height: 900 },
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
  {
    name: "cidades-mapa-zoom-sobral-1440.png",
    path: "/cidades?cidade=sobral",
    width: 1440,
    height: 900,
    region: "Sobral",
  },
  {
    name: "cidades-mapa-emprego-1440.png",
    path: "/cidades?cidade=sobral",
    width: 1440,
    height: 900,
    mapMode: "Emprego",
  },
  {
    name: "cidades-mapa-renda-1440.png",
    path: "/cidades?cidade=sobral",
    width: 1440,
    height: 900,
    mapMode: "Renda",
  },
  {
    name: "cidades-mapa-populacao-1440.png",
    path: "/cidades?cidade=sobral",
    width: 1440,
    height: 900,
    mapMode: "População",
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
    if (capture.path === "/") {
      await page.locator(".investigation-chapters").waitFor();
      await page.getByText("R$ 120,15 bi", { exact: true }).first().waitFor();
    }
    if (capture.path === "/metodo") {
      await page.locator(".method-catalog-section").waitFor();
    }
    if (capture.path.startsWith("/cidades")) {
      await page.locator(".map-shape").first().waitFor();
      const shapeCount = await page.locator(".map-shape").count();
      if (shapeCount !== 184) {
        throw new Error(`${capture.name}: esperadas 184 geometrias; recebidas ${shapeCount}.`);
      }
      const territoryPressed = await page
        .getByRole("button", { name: "Território", exact: true })
        .getAttribute("aria-pressed");
      const initialRegion = await page.getByLabel("Zoom regional").inputValue();
      if (territoryPressed !== "true" || initialRegion !== "") {
        throw new Error(`${capture.name}: território com Ceará inteiro não abriu como padrão.`);
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
      await dialog.getByText("R$ 1.751,34", { exact: true }).waitFor();
    }
    if (capture.region) {
      const map = page.locator(".municipality-map-panel");
      await map.getByLabel("Zoom regional").selectOption(capture.region);
      const viewBox = await map.locator("svg").getAttribute("viewBox");
      if (viewBox === "0 0 640 620") {
        throw new Error(`${capture.name}: o zoom regional não alterou a área visível.`);
      }
      await map.getByText(`${capture.region} · 23 municípios`, { exact: true }).waitFor();
    }
    if (capture.mapMode) {
      const map = page.locator(".municipality-map-panel");
      await map.getByRole("button", { name: capture.mapMode, exact: true }).click();
      if (capture.mapMode === "Emprego" && (await map.locator(".employment-symbol").count()) !== 178) {
        throw new Error(`${capture.name}: esperados 178 símbolos de emprego com saldo não nulo.`);
      }
      if (capture.mapMode === "Renda" && (await map.locator(".income-map-legend").count()) !== 1) {
        throw new Error(`${capture.name}: legenda de renda ausente.`);
      }
      if (capture.mapMode === "População" && (await map.locator(".population-symbol").count()) !== 184) {
        throw new Error(`${capture.name}: cartograma não contém 184 municípios.`);
      }
      if (capture.mapMode === "População") {
        const overlaps = await map.locator(".population-symbol").evaluateAll((circles) => {
          const nodes = circles.map((circle) => ({
            x: Number(circle.getAttribute("cx")),
            y: Number(circle.getAttribute("cy")),
            radius: Number(circle.getAttribute("r")),
          }));
          let count = 0;
          for (let left = 0; left < nodes.length; left += 1) {
            for (let right = left + 1; right < nodes.length; right += 1) {
              const dx = nodes[right].x - nodes[left].x;
              const dy = nodes[right].y - nodes[left].y;
              if (Math.hypot(dx, dy) < nodes[left].radius + nodes[right].radius - 0.5) count += 1;
            }
          }
          return count;
        });
        if (overlaps > 0) throw new Error(`${capture.name}: ${overlaps} sobreposições no cartograma.`);
      }
      const selectedName = await page.locator(".coverage-heading h2").textContent();
      if (selectedName !== "Sobral" || !page.url().includes("cidade=sobral")) {
        throw new Error(`${capture.name}: trocar a visualização alterou o município selecionado.`);
      }
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
    if (capture.name === "home-1440.png") {
      const cap1 = page.locator("#panorama");
      await cap1.scrollIntoViewIfNeeded();
      await cap1.screenshot({
        path: resolve(outputDirectory, "home-capitulo1-panorama-1440.png"),
      });

      const cap2 = page.locator("#evolucao");
      await cap2.scrollIntoViewIfNeeded();
      await cap2
        .getByRole("button", { name: /Ativo problemático/i })
        .click();
      await cap2.screenshot({
        path: resolve(outputDirectory, "home-capitulo2-evolucao-quebra2025-1440.png"),
      });

      const cap3 = page.locator("#dividas");
      await cap3.scrollIntoViewIfNeeded();
      await cap3.screenshot({
        path: resolve(outputDirectory, "home-capitulo3-perfis-1440.png"),
      });

      const cap4 = page.locator("#trabalho-e-percepcao");
      await cap4.scrollIntoViewIfNeeded();
      await cap4.getByRole("row").filter({ hasText: "2025-11" }).getByText("72,20%").waitFor();
      await cap4.screenshot({
        path: resolve(outputDirectory, "home-capitulo4-trabalho-percepcao-1440.png"),
      });
    }
    if (capture.name === "cidades-sobral-1440.png") {
      const fortalezaShape = page.locator(".map-shape").filter({ hasText: "Fortaleza" });
      await fortalezaShape.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, 140));
      const scrollBeforeSelection = await page.evaluate(() => window.scrollY);
      await fortalezaShape.click();
      await page.waitForURL(/cidade=fortaleza/);
      await page.locator(".coverage-heading h2", { hasText: "Fortaleza" }).waitFor();
      const clickedRegion = await page.getByLabel("Zoom regional").inputValue();
      const clickedViewBox = await page.locator(".municipality-map-panel svg").getAttribute("viewBox");
      if (clickedRegion !== "Fortaleza" || clickedViewBox === "0 0 640 620") {
        throw new Error(
          `Clique territorial não ativou o zoom regional: ${clickedRegion || "sem região"}.`,
        );
      }
      const clickedShapeStyle = await fortalezaShape.evaluate((element) => ({
        outlineStyle: getComputedStyle(element).outlineStyle,
        strokeWidth: Number.parseFloat(getComputedStyle(element).strokeWidth),
      }));
      if (clickedShapeStyle.outlineStyle !== "none" || clickedShapeStyle.strokeWidth > 1) {
        throw new Error("Seleção pelo mouse manteve uma borda visível no município.");
      }
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

      // Phase 04 (04-04 & 04-05): Verify 3-city comparison and eligible-only ranking
      const comparisonCounter = await page.locator(".comparison-counter strong").textContent();
      if (comparisonCounter?.trim() !== "3") {
        throw new Error(`Comparação municipal esperada com 3 cidades; recebido: ${comparisonCounter}`);
      }
      const pilotChipCount = await page.locator(".pilot-chip-button").count();
      if (pilotChipCount !== 8) {
        throw new Error(`Esperados 8 botões de cidades-piloto; recebidos: ${pilotChipCount}`);
      }
      const debtMessage = await page.locator(".comparison-unavailable-cell").textContent();
      if (!debtMessage?.includes("Ainda não existe uma fonte municipal validada")) {
        throw new Error("Linha de dívida municipal perdeu a indisponibilidade explícita.");
      }

      const comparisonSection = page.locator(".municipal-comparison-section");
      await comparisonSection.scrollIntoViewIfNeeded();
      await page.locator(".site-header, .skip-link").evaluateAll((elements) => {
        for (const element of elements) element.style.visibility = "hidden";
      });
      await comparisonSection.screenshot({
        path: resolve(outputDirectory, "cidades-comparacao-1440.png"),
      });
      await page.locator(".site-header, .skip-link").evaluateAll((elements) => {
        for (const element of elements) element.style.visibility = "";
      });

      const rankingSection = page.locator(".municipal-ranking-section");
      await rankingSection.scrollIntoViewIfNeeded();
      await page.locator(".site-header, .skip-link").evaluateAll((elements) => {
        for (const element of elements) element.style.visibility = "hidden";
      });
      await rankingSection.screenshot({
        path: resolve(outputDirectory, "cidades-ranking-mediana-1440.png"),
      });
      await page.locator(".site-header, .skip-link").evaluateAll((elements) => {
        for (const element of elements) element.style.visibility = "";
      });

      const rankingSearch = rankingSection.getByLabel("Encontrar município");
      await rankingSearch.fill("Sobral");
      await page.waitForFunction(
        () => document.querySelectorAll(".ranking-visual-list > li").length === 1,
      );
      const filteredRankingCount = await rankingSection.locator(".ranking-visual-list > li").count();
      if (filteredRankingCount !== 1) {
        throw new Error(`Busca do ranking deveria retornar Sobral; recebidos: ${filteredRankingCount}.`);
      }
      await rankingSearch.fill("");

      await rankingSection.getByLabel("Indicador do ranking").selectOption("admission_salary_202609");
      await rankingSection.locator(".ranking-summary-counts strong", { hasText: "177" }).waitFor();
      await rankingSection.getByText("7 municípios", { exact: true }).waitFor();
      const excludedButtonsCount = await rankingSection
        .locator(".excluded-city-list button")
        .count();
      if (excludedButtonsCount !== 7) {
        throw new Error(
          `Esperados 7 municípios excluídos por null no ranking salarial; recebidos: ${excludedButtonsCount}`,
        );
      }

      await rankingSection.screenshot({
        path: resolve(outputDirectory, "cidades-ranking-salario-1440.png"),
      });

      await rankingSection.getByLabel("Indicador do ranking").selectOption("divida_municipal_direta");
      await rankingSection.locator(".ranking-ineligible-banner").waitFor();
      await rankingSection.getByText("0 de 184 municípios", { exact: true }).waitFor();

      await rankingSection.screenshot({
        path: resolve(outputDirectory, "cidades-ranking-divida-1440.png"),
      });
    }
    if (capture.name === "cidades-sobral-390.png") {
      const comparisonSection = page.locator(".municipal-comparison-section");
      await comparisonSection.scrollIntoViewIfNeeded();
      await page.locator(".site-header, .skip-link").evaluateAll((elements) => {
        for (const element of elements) element.style.visibility = "hidden";
      });
      await comparisonSection.screenshot({
        path: resolve(outputDirectory, "cidades-comparacao-390.png"),
      });
      const rankingSection = page.locator(".municipal-ranking-section");
      await rankingSection.scrollIntoViewIfNeeded();
      await rankingSection.screenshot({
        path: resolve(outputDirectory, "cidades-ranking-mediana-390.png"),
      });
    }
    await context.close();
  }
} finally {
  await browser.close();
}
