import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function isLoginRedirect(page) {
  const url = page.url();
  return url.includes('/accounts/login');
}

async function scrapeReels(username, limit = 5) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // ✅ Load session cookies (must be saved locally beforehand)
  const cookiesPath = path.resolve('cookies.json');
  if (!fs.existsSync(cookiesPath)) {
    await browser.close();
    throw new Error('Missing cookies.json. Please log in locally and save session cookies.');
  }

  const cookies = JSON.parse(fs.readFileSync(cookiesPath));
  await context.addCookies(cookies);

  const page = await context.newPage();
  const reelsUrl = `https://www.instagram.com/${username}/reels/`;
  await page.goto(reelsUrl, { waitUntil: 'domcontentloaded' });

  // ✅ Check if session is still valid
  if (await isLoginRedirect(page)) {
    await browser.close();
    throw new Error('Session expired or invalid. Please refresh cookies.json.');
  }

  // ✅ Scroll and collect reel links
  const reelLinks = new Set();
  for (let i = 0; i < 10 && reelLinks.size < limit; i++) {
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(1500);

    const links = await page.$$eval('a', anchors =>
      anchors.map(a => a.href).filter(href => href.includes('/reel/'))
    );
    links.forEach(link => reelLinks.add(link));
  }

  // ✅ Visit each reel and extract metadata
  const reels = [];
  for (const link of Array.from(reelLinks).slice(0, limit)) {
    await page.goto(link, { waitUntil: 'domcontentloaded' });

    const caption = await page.$eval('meta[property="og:description"]', el => el.content).catch(() => '');
    const thumbnail = await page.$eval('meta[property="og:image"]', el => el.content).catch(() => '');
    const postedAt = new Date().toISOString();

    reels.push({ reel_url: link, caption, thumbnail_url: thumbnail, posted_at: postedAt });
  }

  await browser.close();
  return reels;
}

export default scrapeReels;