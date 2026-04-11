# Changelog

All notable changes to this project will be documented here.

## [Unreleased]

## [1.3.0] - 2026-04-11

### Added
- Filter tabs restored: **All · AWS · Azure · Google Cloud · HashiCorp** in the page header (PR #18)

### Fixed
- RSS feed fetches now use `Promise.race` with a 15-second hard timeout, preventing any single slow or unresponsive feed from hanging the GitHub Actions deploy indefinitely (PR #20)
  - Root cause: `rss-parser`'s built-in `timeout` option only covers TCP connection establishment; a feed that connects but stalls mid-response would block forever
  - Previous attempt used `AbortController` (PR #19) which caused a `callback is not a function` crash because `rss-parser` does not support the `AbortSignal` API

## [1.2.0] - 2026-04-03

### Added
- Breaking-news ticker at the top of the page showing the 6 most recent headlines (PR #1)

### Changed
- `news.json` refreshed with latest cloud news items (PR #10)

## [1.1.0] - 2026-04-03

### Removed
- Source filter tabs removed from the header (PR #9)

## [1.0.0] - Initial release

### Added
- Static news aggregator pulling from AWS, Azure, Google Cloud, HashiCorp, and Cloudflare RSS feeds
- Dark-mode card grid UI with per-source colour coding
- GitHub Actions workflow deploying to GitHub Pages on push to `main`
