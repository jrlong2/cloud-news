const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; cloud-news-bot/1.0)',
  },
});

const FEEDS = [
  {
    url: 'https://aws.amazon.com/about-aws/whats-new/recent/feed/',
    source: "AWS What's New",
  },
  {
    url: 'https://azure.microsoft.com/en-us/updates/feed/',
    source: 'Azure Updates',
  },
  {
    url: 'https://cloudblog.withgoogle.com/products/gcp/rss/',
    source: 'Google Cloud Blog',
  },
  {
    url: 'https://www.hashicorp.com/blog/feed.xml',
    source: 'HashiCorp Blog',
  },
  {
    url: 'https://blog.cloudflare.com/rss/',
    source: 'Cloudflare Blog',
  },
];

const FEED_TIMEOUT_MS = 15000;

async function fetchFeed(feedConfig) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FEED_TIMEOUT_MS);
  try {
    const feed = await parser.parseURL(feedConfig.url, { signal: controller.signal });
    return feed.items.map((item) => ({
      title: item.title || 'Untitled',
      link: item.link || item.guid || '',
      source: feedConfig.source,
      pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
    }));
  } catch (err) {
    const reason = controller.signal.aborted ? `timed out after ${FEED_TIMEOUT_MS}ms` : err.message;
    console.warn(`Warning: Failed to fetch ${feedConfig.source}: ${reason}`);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  console.log('Fetching cloud news feeds...');

  const results = await Promise.all(FEEDS.map(fetchFeed));
  const allItems = results.flat();

  // Sort by pubDate descending, take top 30
  allItems.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  const items = allItems.slice(0, 30);

  const output = {
    lastUpdated: new Date().toISOString(),
    items,
  };

  const outPath = path.join(__dirname, '..', 'news.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`Done! Wrote ${items.length} items to news.json`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
