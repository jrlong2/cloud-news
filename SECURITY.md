# Security Audit Report — `fetch-news.js`

**Date:** 2026-03-31
**Scope:** `scripts/fetch-news.js`, `index.html`, `package.json`, and transitive dependencies

---

## Summary

The audit identified **7 findings** (2 High, 3 Medium, 2 Low). No known CVEs were
found in the current dependency tree (`npm audit` clean), but several application-level
issues exist that could be exploited if an upstream RSS feed is compromised or
maliciously crafted.

---

## Findings

### HIGH-1: DOM-based XSS via error message injection (`index.html:330-331`)

**Severity:** High
**Location:** `index.html` line 331

The `fetch()` error handler interpolates `err.message` directly into `innerHTML`
without escaping:

```js
document.getElementById('loading').innerHTML =
  `<p style="color:#e57373">Failed to load news.json: ${err.message}</p>`;
```

If an attacker can influence the error message (e.g., via a crafted response or a
service worker), arbitrary HTML/JS will execute in the page context.

**Recommendation:** Use `textContent` instead of `innerHTML`, or apply the existing
`escHtml()` helper to `err.message`.

---

### HIGH-2: Open redirect / `javascript:` URL execution via unvalidated `item.link` (`index.html:284-286`)

**Severity:** High
**Location:** `index.html` line 285

The card click handler calls `window.open(item.link, ...)` with the raw link value
from `news.json`. Because the RSS feed data is not validated, a malicious feed could
inject a `javascript:` or `data:` URI:

```js
card.addEventListener('click', () => {
  window.open(item.link, '_blank', 'noopener,noreferrer');
});
```

While the `<a href>` on line 274 does pass through `escHtml()`, that only prevents
HTML injection — it does not block dangerous URI schemes.

**Recommendation:** Validate that `item.link` starts with `https://` (or `http://`)
before passing it to `window.open()` and before rendering it in `href`. Reject or
strip any other scheme.

---

### MED-1: No RSS payload size or item-count limit (`scripts/fetch-news.js:37-43`)

**Severity:** Medium
**Location:** `scripts/fetch-news.js`, `fetchFeed()`

The script fetches and parses the full response body of each feed with no upper bound
on response size or item count. A compromised or malicious feed could serve an
extremely large XML document, causing:

- Excessive memory consumption (OOM)
- CPU exhaustion during XML parsing (billion-laughs / entity expansion)

The `rss-parser` library relies on `xml2js` (→ `sax`), which does **not** limit
entity expansion by default.

**Recommendation:**
- Set a `maxRedirects` and `maxContentLength` on the HTTP request (e.g., via custom
  Axios instance passed to `rss-parser`).
- Cap the number of items consumed per feed (e.g., `.slice(0, 50)` on `feed.items`).

---

### MED-2: No URL-scheme validation on feed item links (`scripts/fetch-news.js:40`)

**Severity:** Medium
**Location:** `scripts/fetch-news.js` line 40

The link value from the RSS item is stored verbatim:

```js
link: item.link || item.guid || '',
```

There is no validation that the link is a safe HTTP(S) URL. Dangerous schemes
(`javascript:`, `data:`, `vbscript:`) will be persisted to `news.json` and later
consumed by the frontend (see HIGH-2).

**Recommendation:** Validate and normalize each link to require the `https://` or
`http://` scheme before writing to `news.json`. Discard items with invalid links.

---

### MED-3: Synchronous file write is non-atomic (`scripts/fetch-news.js:66`)

**Severity:** Medium
**Location:** `scripts/fetch-news.js` line 66

`fs.writeFileSync` writes directly to `news.json`. If the process is killed or an
error occurs mid-write, the file will be left in a corrupt/partial state, breaking
the frontend.

**Recommendation:** Write to a temporary file in the same directory, then
`fs.renameSync()` it to `news.json`. Rename is atomic on most filesystems.

---

### LOW-1: Dependency version range allows untested updates (`package.json:9`)

**Severity:** Low
**Location:** `package.json` line 9

`rss-parser` is specified as `^3.13.0`, which permits any `3.x.y ≥ 3.13.0`. A
future minor or patch release could introduce a regression or vulnerability that
would be silently adopted on the next `npm install`.

**Recommendation:** Pin the exact version (`"rss-parser": "3.13.0"`) or use a
lockfile-only install strategy (`npm ci`) in CI/CD to guarantee reproducible builds.

---

### LOW-2: Verbose error output may disclose internal paths (`scripts/fetch-news.js:45, 71`)

**Severity:** Low
**Location:** `scripts/fetch-news.js` lines 45 and 71

`err.message` (and potentially `err.stack`) is logged to stdout/stderr. In a CI or
server environment where logs are aggregated, this can leak internal filesystem paths,
hostnames, or network topology.

**Recommendation:** Log only a sanitized summary. Avoid logging full stack traces in
production; gate verbose logging behind a `DEBUG` or `NODE_ENV` flag.

---

## Dependency Inventory

| Package | Version | Notes |
|---|---|---|
| rss-parser | 3.13.0 | Direct dependency; no known CVEs |
| xml2js | 0.5.0 | Transitive (via rss-parser); no known CVEs at this version |
| sax | 1.6.0 | Transitive (via xml2js); no entity-expansion limits |
| entities | 2.2.0 | Transitive (via rss-parser) |
| xmlbuilder | 11.0.1 | Transitive (via xml2js) |

`npm audit` reports **0 known vulnerabilities** as of 2026-03-31.

---

## Recommended Priority

1. **HIGH-1 / HIGH-2** — Fix the DOM XSS and open-redirect issues in `index.html`
   immediately; these are client-side and exploitable today if a feed is compromised.
2. **MED-2** — Add URL-scheme validation in `fetch-news.js` to close the server-side
   half of HIGH-2.
3. **MED-1** — Add payload size limits to defend against DoS via oversized feeds.
4. **MED-3** — Switch to atomic writes for data integrity.
5. **LOW-1 / LOW-2** — Pin dependencies and tighten logging at your convenience.
