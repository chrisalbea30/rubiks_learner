// Layout check across screen widths. Needs the app running: npm run build && npx next start -p 3123
// Usage: node scripts/mobile-check.mjs [outDir]
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3123";
const OUT = process.argv[2];
const PAGES = ["/", "/notation", "/cross", "/f2l", "/oll", "/pll", "/solve", "/practice"];
const WIDTHS = [320, 375, 414, 768, 1024];

const browser = await chromium.launch({ channel: "msedge", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
let problems = 0;

for (const width of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width, height: 800 }, deviceScaleFactor: 1, isMobile: width < 768, hasTouch: width < 768 });
  const page = await ctx.newPage();
  // Interactive states worth checking too: [path, label, action]
  const STATES = [
    ...PAGES.map((p) => [p, "", null]),
    ["/f2l", "case sheet open", (pg) => pg.getByRole("button", { name: /Case 5/ }).first().click()],
    ["/pll", "case sheet open", (pg) => pg.getByRole("button", { name: /Na perm/ }).first().click()],
    ["/cross", "solution shown", (pg) => pg.getByRole("button", { name: "Show the best cross" }).click()],
    ["/practice", "drill revealed", (pg) => pg.getByRole("button", { name: "Reveal" }).click()],
    ["/solve", "example entered", (pg) => pg.getByRole("button", { name: "Try an example" }).click()],
    ["/solve", "solution shown", async (pg) => {
      await pg.getByRole("button", { name: "Try an example" }).click();
      await pg.getByRole("button", { name: /Show me how to solve it/ }).click();
    }],
  ];
  for (const [path, label, action] of STATES) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    if (action) {
      await action(page);
      await page.waitForTimeout(1200);
    }
    const report = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const issues = [];
      if (document.documentElement.scrollWidth > vw + 1) issues.push(`page scrolls sideways: ${document.documentElement.scrollWidth}px > ${vw}px`);
      const describe = (el) => {
        const cls = typeof el.className === "string" ? el.className.split(" ").slice(0, 4).join(".") : "";
        const text = (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40);
        return `<${el.tagName.toLowerCase()} .${cls}> "${text}"`;
      };
      // Is the element inside a scroll/clip container (e.g. the nav)?
      const clipped = (el) => {
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const s = getComputedStyle(p);
          if (s.overflowX !== "visible") return true;
        }
        return false;
      };
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const s = getComputedStyle(el);
        if (s.position === "fixed" || s.visibility === "hidden") continue;
        if ((r.right > vw + 1 || r.left < -1) && !clipped(el)) issues.push(`off-screen: ${describe(el)} [${Math.round(r.left)}..${Math.round(r.right)}]`);
        // Text cut off inside its own box
        if (el.children.length === 0 && el.scrollWidth > el.clientWidth + 1 && s.overflowX !== "visible" && el.clientWidth > 0 && !["CANVAS", "svg"].includes(el.tagName))
          issues.push(`text clipped: ${describe(el)} (${el.scrollWidth} > ${el.clientWidth})`);
      }
      // Overlapping text: leaf text blocks whose boxes intersect
      const leaves = [...document.querySelectorAll("body *")].filter((el) => {
        if (el.closest("svg, canvas, [aria-hidden], .pointer-events-none")) return false;
        const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
        if (!hasText) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(el).position !== "fixed";
      });
      // Compare each rendered line of text (not the whole block), so wrapped inline text isn't a false hit.
      const boxes = leaves.map((el) => {
        const rects = [];
        for (const n of el.childNodes) {
          if (n.nodeType !== 3 || !n.textContent.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(n);
          rects.push(...[...range.getClientRects()].filter((r) => r.width > 1));
        }
        // Layer = nearest fixed/sticky ancestor. Content scrolling under the sticky header, or a sheet
        // covering the page, is intended; only text in the same layer can collide.
        let layer = null;
        for (let p = el; p && p !== document.body; p = p.parentElement) {
          const pos = getComputedStyle(p).position;
          if (pos === "fixed" || pos === "sticky") {
            layer = p;
            break;
          }
        }
        return { el, rects, layer };
      });
      const hit = (a, b) =>
        Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 3;
      for (let i = 0; i < boxes.length; i++)
        for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i], b = boxes[j];
          if (a.el.contains(b.el) || b.el.contains(a.el) || a.layer !== b.layer) continue;
          if (a.rects.some((ra) => b.rects.some((rb) => hit(ra, rb)))) issues.push(`text overlap: ${describe(a.el)} × ${describe(b.el)}`);
        }
      return [...new Set(issues)].slice(0, 25);
    });
    if (report.length) {
      problems += report.length;
      console.log(`\n[${width}px] ${path}${label ? ` (${label})` : ""}`);
      report.forEach((r) => console.log("  - " + r));
    }
    const name = `${width}${path === "/" ? "_home" : path.replace("/", "_")}${label ? "_" + label.replace(/\s+/g, "-") : ""}`;
    if (OUT && width <= 414) await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: !label });
  }
  await ctx.close();
}

await browser.close();
console.log(problems ? `\n${problems} layout issues` : "\nNo layout issues found");
process.exit(problems ? 1 : 0);
