import { chromium } from 'playwright';


// const INSTAGRAM_SESSIONID = process.env.INSTAGRAM_SESSIONID;
async function scrapeReels(username, limit = 5) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  // Add cookies
//   if (INSTAGRAM_SESSIONID) {
//  await context.addCookies([{
//    name: 'sessionid',
//    value: INSTAGRAM_SESSIONID,
//    domain: '.instagram.com',
//    path: '/',
//    httpOnly: true,
//    secure: true,
//    sameSite: 'Lax',
//  }]);
// }
  const page = await context.newPage();

  try {
    const profileUrl = `https://www.instagram.com/${username}`;
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded' });



    //  Scroll and collect reel links
    const reelLinks = new Set();
    for (let i = 0; i < 10 && reelLinks.size < limit; i++) {
      await page.mouse.wheel(0, 2000);
      await page.waitForTimeout(1500);

      const links = await page.$$eval('a[href*="/reel/"]', anchors =>
        anchors.map(a => a.href)
      );
      links.forEach(link => reelLinks.add(link));
    }

    //  Diagnose if no reels found
    if (reelLinks.size === 0) {
      const finalText = await page.evaluate(() => document.body.innerText);
      const finalUrl = page.url();

      if (finalUrl.includes('/accounts/login')) {
        throw new Error('Login required. Instagram redirected to login page.');
      }
      if (finalText.includes('This account is private')) {
        throw new Error('Account is private. Reels are not accessible.');
      }
      if (finalText.includes("Sorry, this page isn't available")) {
        throw new Error('Account does not exist or URL is invalid.');
      }
      if (finalText.includes('No Reels yet')) {
        throw new Error('Account has no Reels.');
      }

      throw new Error('No reels found. Possible reasons: private account, empty Reels tab, or session expired.');
    }

    // Extract metadata from each reel
    const reels = [];
    for (const url of Array.from(reelLinks).slice(0, limit)) {
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      const [caption, thumbnail] = await Promise.all([
        page.$eval('meta[property="og:description"]', el => el.content).catch(() => ''),
        page.$eval('meta[property="og:image"]', el => el.content).catch(() => ''),
      ]);

      reels.push({
        reel_url: url,
        caption,
        thumbnail_url: thumbnail,
        posted_at: new Date().toISOString(),
      });
    }

    await browser.close();
    return { success: true, data: reels };
  } catch (err) {
    await browser.close();
    return {
      success: false,
      error: {
        message: err.message || 'Unknown error occurred',
        code: err.name || 'ScrapeError',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export default scrapeReels;