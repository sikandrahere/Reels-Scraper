import { chromium } from 'playwright';

async function scrapeReels(username, limit = 5) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`https://www.instagram.com/${username}/reels/`, { waitUntil: 'domcontentloaded' });

  // Abort if login is required
  const requiresLogin = await page.evaluate(() =>
    document.body.innerText.includes('Log in')
  );
  if (requiresLogin) {
    await browser.close();
    throw new Error('Reels are not publicly accessible. Login required.');
  }

  // Scroll and collect reel links
  const reelLinks = new Set();
  for (let i = 0; i < 10 && reelLinks.size < limit; i++) {
    await page.mouse.wheel(0, 2000);
    await page.waitForTimeout(1000);

    const links = await page.$$eval('a[href*="/reel/"]', as =>
      as.map(a => a.href)
    );
    links.forEach(link => reelLinks.add(link));
  }

  // Extract metadata from each reel
  const reels = [];
  for (const url of Array.from(reelLinks).slice(0, limit)) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const [caption, thumbnail] = await Promise.all([
      page.$eval('meta[property="og:description"]', el => el.content).catch(() => ''),
      page.$eval('meta[property="og:image"]', el => el.content).catch(() => '')
    ]);

    reels.push({ reel_url: url, caption, thumbnail_url: thumbnail, posted_at: new Date().toISOString() });
  }

  await browser.close();
  return reels;
}

export default scrapeReels;