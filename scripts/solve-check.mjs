// End-to-end check of the My Cube page. Needs the app running on port 3123.
// Usage: node scripts/solve-check.mjs [screenshotDir]
import { chromium } from "playwright-core";
import { writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3123";
const OUT = process.argv[2];
let failures = 0;
const check = (ok, msg) => {
  console.log(`${ok ? "  ok " : "FAIL "} ${msg}`);
  if (!ok) failures++;
};

const browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("dialog", (d) => d.accept());
const shot = async (name) => OUT && page.screenshot({ path: `${OUT}/solve_${name}.png`, fullPage: true });

await page.goto(`${BASE}/solve`, { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });

// 1. Example scramble -> solve
await page.getByRole("button", { name: "Try an example" }).click();
await page.waitForTimeout(300);
check(await page.getByText("Looks good! Your cube can be solved.").isVisible(), "example cube is accepted");
await shot("1_example");
await page.getByRole("button", { name: /Show me how to solve it/ }).click();
await page.waitForTimeout(1200);
const title = await page.locator("#step-card h2").textContent();
check(/cross/i.test(title ?? ""), `first step is the cross ("${title}")`);
await shot("2_solution");
let steps = 0;
for (; steps < 20; steps++) {
  const next = page.getByRole("button", { name: /Done, next step/ });
  if (!(await next.isVisible())) break;
  await next.click();
  await page.waitForTimeout(150);
}
await page.getByRole("button", { name: /Done, finished/ }).click();
check(await page.getByText("Solved! 🎉").isVisible(), `stepped through ${steps + 1} steps to "Solved!"`);
await page.getByRole("button", { name: "Full solution" }).click();
const listed = await page.locator("#step-card ~ section ol li").count();
check(listed === steps + 1, `full solution lists every step (${listed})`);
await page.getByRole("button", { name: "Full OLL/PLL" }).click();
await page.waitForTimeout(500);
check(await page.locator("#step-card").isVisible(), "switching to full OLL/PLL re-plans the solve");

// 2. Manual entry: ten reds is flagged
await page.getByRole("button", { name: "← Edit my cube" }).click();
await page.getByRole("button", { name: "Clear all" }).click();
// The red centre already counts as one, so 9 more makes 10
for (let k = 0; k < 9; k++) await page.getByRole("button", { name: "Fill red" }).click();
await page.waitForTimeout(200);
check(await page.getByText(/10 red stickers/).first().isVisible(), "a 10th red sticker is reported");
await shot("3_ten_reds");

// 3. PLL mode locks everything but the top-layer side stickers
await page.getByRole("button", { name: /^PLL/ }).click();
await page.waitForTimeout(200);
const counter = await page.locator("text=/\\d+\\/12 stickers/").textContent();
check(/\/12 stickers/.test(counter ?? ""), `PLL mode asks for 12 stickers (${counter})`);
await page.getByRole("button", { name: "Try an example" }).click();
await page.getByRole("button", { name: /Show me how to solve it/ }).click();
await page.waitForTimeout(800);
const pllTitle = await page.locator("#step-card h2").textContent();
check(/PLL|Final turn/.test(pllTitle ?? ""), `PLL mode starts at PLL ("${pllTitle}")`);
await page.getByRole("button", { name: "← Edit my cube" }).click();

// 4. Photo: draw a known face with uneven lighting and noise, upload it, check the colours read
await page.getByRole("button", { name: /^From scratch/ }).click();
await page.getByRole("button", { name: "Clear all" }).click();
const expected = ["red", "white", "blue", "orange", "green", "yellow", "green", "red", "white"]; // centre must be green (front)
const png = await page.evaluate((cols) => {
  const hex = { white: [225, 228, 226], yellow: [230, 214, 50], green: [24, 160, 86], blue: [28, 80, 182], red: [190, 32, 44], orange: [245, 118, 40] };
  const c = document.createElement("canvas");
  c.width = 900;
  c.height = 1200; // portrait phone photo, face not centred
  const g = c.getContext("2d");
  g.fillStyle = "#6b5b4a";
  g.fillRect(0, 0, 900, 1200);
  const ox = 140, oy = 330, cell = 200;
  g.fillStyle = "#111";
  g.fillRect(ox - 12, oy - 12, cell * 3 + 24, cell * 3 + 24);
  cols.forEach((name, i) => {
    const [r, gg, b] = hex[name];
    const x = ox + (i % 3) * cell, y = oy + Math.floor(i / 3) * cell;
    const shade = 0.8 + 0.3 * ((i % 3) / 2); // light falls off to the left
    g.fillStyle = `rgb(${r * shade},${gg * shade},${b * shade})`;
    g.fillRect(x + 10, y + 10, cell - 20, cell - 20);
  });
  const img = g.getImageData(0, 0, 900, 1200);
  for (let k = 0; k < img.data.length; k += 4) {
    const n = (Math.random() - 0.5) * 30;
    img.data[k] += n;
    img.data[k + 1] += n;
    img.data[k + 2] += n;
  }
  g.putImageData(img, 0, 0);
  return c.toDataURL("image/png").split(",")[1];
}, expected);
const file = join(tmpdir(), "cube-face-test.png");
writeFileSync(file, Buffer.from(png, "base64"));

await page.getByRole("button", { name: /Photo of this face/ }).click();
await page.locator('input[type="file"]').setInputFiles(file);
await page.waitForTimeout(500);
// Move the guide over the face: image is 900x1200 contained in a square, face at x 140..740, y 330..930
const box = await page.locator(".aspect-square.touch-none").boundingBox();
const scale = box.height / 1200;
const left = (box.width - 900 * scale) / 2;
const want = { x: left + 140 * scale, y: 330 * scale, size: 600 * scale };
await page.locator('input[type="range"]').fill(String(want.size / box.width));
const guide = page.locator(".cursor-move");
const g0 = await guide.boundingBox();
await page.mouse.move(g0.x + 10, g0.y + 10);
await page.mouse.down();
await page.mouse.move(box.x + want.x + 10, box.y + want.y + 10, { steps: 5 });
await page.mouse.up();
await shot("4_photo_adjust");
await page.getByRole("button", { name: "Read colours" }).click();
await page.waitForTimeout(200);
await shot("5_photo_review");
await page.getByRole("button", { name: "Use these" }).click();
await page.waitForTimeout(200);
const read = await page.evaluate(() => JSON.parse(localStorage.getItem("cfop-mycube-v1")).stickers);
// Front face slots in reading order are 18..26 in cube.ts
const front = read.slice(18, 27);
check(JSON.stringify(front) === JSON.stringify(expected), `photo colours read correctly: ${front.join(", ")}`);

check(errors.length === 0, `no page errors${errors.length ? ": " + errors.join(" | ") : ""}`);
await browser.close();
console.log(failures ? `\n${failures} failures` : "\nAll My Cube checks passed");
process.exit(failures ? 1 : 0);
