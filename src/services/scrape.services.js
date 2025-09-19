import { chromium } from 'playwright';

async function isLoginRedirect(page) {
  const url = page.url();
  return url.includes('/accounts/login');
}

async function scrapeReels(username, limit = 5) {

  let browser = await chromium.launch({ headless: true });
  let context = await browser.newContext();
  let page = await context.newPage();

  await page.goto('https://www.instagram.com/${username}/reels/', { waitUntil: 'domcontentloaded' });


  if (await isLoginRedirect(page)) {
    console.log(' Redirected to login. Opening manual login window...');

    await browser.close(); // close headless browser


    browser = await chromium.launch({ headless: false });
    context = await browser.newContext();
    page = await context.newPage();

    await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded' });
    console.log('  have 60 seconds to log in manually...');
    await page.waitForTimeout(60000);

    if (await isLoginRedirect(page)) {
      console.log(' Still on login page. Login failed.');
      await browser.close();
      throw new Error('Login required. Cannot proceed.');
    }

    console.log('  login successful.');
  } else {
    console.log('Already logged in');
  }

  const reelsPage = await context.newPage();
  const reelsUrl = `https://www.instagram.com/${username}/reels/`;
  await reelsPage.goto(reelsUrl, { waitUntil: 'domcontentloaded' });

  const reelLinks = new Set();
  for (let i = 0; i < 10 && reelLinks.size < limit; i++) {
    await reelsPage.mouse.wheel(0, 2000);
    await reelsPage.waitForTimeout(1500);

    const links = await reelsPage.$$eval('a', anchors =>
      anchors.map(a => a.href).filter(href => href.includes('/reel/'))
    );
    links.forEach(link => reelLinks.add(link));
  }

  const reels = [];
  for (const link of Array.from(reelLinks).slice(0, limit)) {
    await reelsPage.goto(link, { waitUntil: 'domcontentloaded' });

    const caption = await reelsPage.$eval('meta[property="og:description"]', el => el.content).catch(() => '');
    const thumbnail = await reelsPage.$eval('meta[property="og:image"]', el => el.content).catch(() => '');
    const postedAt = new Date().toISOString();

    reels.push({ reel_url: link, caption, thumbnail_url: thumbnail, posted_at: postedAt });
  }

  await browser.close();
  return reels;
}

export default scrapeReels;