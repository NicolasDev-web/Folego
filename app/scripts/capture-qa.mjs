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
    await page.goto(`${baseUrl}${capture.path}`, { waitUntil: "networkidle" });
    await page.screenshot({
      path: resolve(outputDirectory, capture.name),
      fullPage: true,
    });
    await context.close();
  }
} finally {
  await browser.close();
}

