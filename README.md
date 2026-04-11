# ☁️ Cloud News

A lightweight, static news aggregator for major cloud provider announcements, deployed to [GitHub Pages](https://jrlong2.github.io/cloud-news/).

## Features

- Aggregates RSS feeds from AWS, Google Cloud, HashiCorp, and Cloudflare
- Breaking-news ticker showing the latest headlines
- Filter tabs: **All · AWS · Azure · Google Cloud · HashiCorp**
- Auto-refreshes `news.json` on every push to `main` via GitHub Actions

## Sources

| Provider | Feed |
|---|---|
| AWS What's New | https://aws.amazon.com/about-aws/whats-new/recent/feed/ |
| Azure Updates | https://azure.microsoft.com/en-us/updates/feed/ |
| Google Cloud Blog | https://cloudblog.withgoogle.com/products/gcp/rss/ |
| HashiCorp Blog | https://www.hashicorp.com/blog/feed.xml |
| Cloudflare Blog | https://blog.cloudflare.com/rss/ |

## Local Development

```bash
npm install
npm run update-news   # fetches latest items into news.json
# open index.html in a browser
```

## Deployment

Pushes to `main` automatically trigger the **Deploy to GitHub Pages** workflow which:
1. Fetches the latest news from all RSS feeds (15-second per-feed timeout)
2. Writes up to 30 items into `news.json`, sorted by date
3. Deploys the static site to GitHub Pages

## Project Structure

```
├── index.html          # Single-page UI
├── news.json           # Generated news data (committed by CI)
├── scripts/
│   └── fetch-news.js   # RSS fetch + news.json generation script
├── package.json
└── .github/
    └── workflows/
        └── deploy.yml  # GitHub Pages deploy workflow
```
