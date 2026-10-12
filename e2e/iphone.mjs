// iPhone相当の画面 (390x844) で、ビルドしたWebアプリを実際のブラウザで動かして確認する
// 使い方: npm run build && npm run test:e2e
//   Chromiumの場所は PLAYWRIGHT_CHROMIUM_PATH で指定できます (なければ playwright の標準の場所)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const BASE = '/tomori-math-007';
const DIST = path.resolve('dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.ico': 'image/x-icon', '.json': 'application/json', '.png': 'image/png' };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (!url.startsWith(BASE)) { res.writeHead(404).end(); return; }
  let rel = url.slice(BASE.length) || '/';
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(DIST, rel);
  if (!file.startsWith(DIST) || !fs.existsSync(file)) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const origin = `http://localhost:${server.address().port}${BASE}/`;

const fail = (msg) => { console.error('NG:', msg); process.exitCode = 1; };
const ok = (msg) => console.log('OK:', msg);

const candidates = [process.env.PLAYWRIGHT_CHROMIUM_PATH, undefined].filter((v, i) => i === 1 || v);
let browser;
for (const executablePath of candidates) {
  try { browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] }); break; } catch (e) { if (!executablePath) throw e; }
}

const SYM = { '＋': (a, b) => a + b, '－': (a, b) => a - b, '×': (a, b) => a * b, '÷': (a, b) => a / b };

try {
  for (const [name, viewport, isMobile] of [['iPhone 13', { width: 390, height: 844 }, true], ['iPhone SE', { width: 375, height: 667 }, true], ['PC', { width: 1280, height: 800 }, false]]) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile, hasTouch: isMobile, locale: 'ja-JP' });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(origin);
    await page.getByText('TOMORI MATH').first().waitFor();

    const noOverflow = async (label) => {
      const w = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
      w.sw <= w.cw ? ok(`${name} ${label}: 横にはみ出さない`) : fail(`${name} ${label}: 横スクロールが出ます ${JSON.stringify(w)}`);
    };
    await noOverflow('ホーム');
    const startBtn = page.getByRole('button', { name: 'スタート！' });
    const box = await startBtn.boundingBox();
    box && box.height >= 56 ? ok(`${name} ボタンの高さ ${Math.round(box.height)}px`) : fail(`${name} ボタンが小さい`);
    if (name === 'iPhone 13') await page.screenshot({ path: 'dist-e2e-home.png' });

    // 3年生・たし算・やさしい・えらぶ → 10問
    await page.getByRole('radio', { name: 'たし算' }).click();
    await startBtn.click();
    for (let i = 0; i < 10; i++) {
      const text = (await page.getByTestId('question-text').innerText()).replace(/\s+/g, ' ');
      const m = text.match(/(\d+) (.) (\d+)/);
      const ans = SYM[m[2]](Number(m[1]), Number(m[3]));
      if (i === 0) { await noOverflow('問題'); if (name === 'iPhone 13') await page.screenshot({ path: 'dist-e2e-quiz.png' }); }
      await page.getByTestId(`choice-${ans}`).click();
      await page.getByTestId('feedback-correct').waitFor();
      if (i === 0 && name === 'iPhone 13') await page.screenshot({ path: 'dist-e2e-correct.png' });
      await page.getByTestId('next').click();
    }
    await page.getByTestId('score').waitFor();
    (await page.getByTestId('score').innerText()).includes('10問中 10問') ? ok(`${name} 10問 全問正解の集計`) : fail(`${name} 集計がちがう`);
    await noOverflow('けっか');
    if (name === 'iPhone 13') await page.screenshot({ path: 'dist-e2e-result.png' });

    // 再読み込みしても履歴が残る
    await page.reload();
    await page.getByTestId('home-stats').waitFor();
    ok(`${name} 再読み込み後も履歴が残る`);
    if (errors.length) fail(`${name} JSエラー: ${errors.join(' | ')}`);
    await ctx.close();
  }
} catch (e) {
  fail(String(e));
} finally {
  await browser.close();
  server.close();
}
