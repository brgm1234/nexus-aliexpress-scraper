import { Actor } from 'apify';
import { PlaywrightCrawler } from 'crawlee';
await Actor.init();
const input = await Actor.getInput() ?? {};
const { keywords = ['wireless earbuds'], maxItems = 30, sortBy = 'default' } = input;
const proxyConfiguration = await Actor.createProxyConfiguration({ groups: ['RESIDENTIAL'] });
const sortMap = { default: '0', orders: 'total_tranpro_desc', price_asc: 'price_asc', price_desc: 'price_desc', rating: 'eva_score' };
const crawler = new PlaywrightCrawler({
  proxyConfiguration, headless: true, navigationTimeoutSecs: 90,
  async requestHandler({ page, request }) {
    await page.waitForTimeout(4000);
    const products = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[class*="product-card"]')).map(el => ({
        title: el.querySelector('[class*="title"]')?.innerText?.trim(),
        price: el.querySelector('[class*="price"]')?.innerText?.trim(),
        orders: el.querySelector('[class*="order"]')?.innerText?.trim(),
        rating: el.querySelector('[class*="star"]')?.innerText?.trim(),
        imageUrl: el.querySelector('img')?.src,
        productUrl: el.querySelector('a')?.href,
        store: el.querySelector('[class*="store"]')?.innerText?.trim(),
        freeShipping: el.innerText.toLowerCase().includes('free shipping'),
      })).filter(p => p.title);
    });
    console.log('Found ' + products.length + ' products for: ' + request.userData.keyword);
    await Actor.pushData(products.slice(0, request.userData.maxItems));
  },
});
const requests = keywords.map(keyword => ({
  url: 'https://www.aliexpress.com/wholesale?SearchText=' + encodeURIComponent(keyword) + '&SortType=' + (sortMap[sortBy] || '0'),
  userData: { keyword, maxItems }
}));
await crawler.run(requests);
await Actor.exit();