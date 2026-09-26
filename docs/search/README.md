# Minsoo Kim: search and content operations

Audit date: 2026-09-26. Canonical origin: https://kmshack.kr

## Validation

Run from `kmshack.kr`: `Jekyll build; python3 tests/verify_agent_readiness.py --site BUILD_DIR`.
Generated HTML must be rebuilt from its source. Validate the returned HTML without JavaScript, canonical URLs, sitemap entries, feed XML, JSON-LD, and real 404 status before deployment. Preserve intentional noindex on user shares and authenticated routes.

## Content model and publishing gate

Use `article-template.json` when preparing an article. Keep question, direct answer, data_asof, primary sources, FAQ, original publication date, true modification date, related pages, and human review in one source. Render FAQ text and JSON-LD from the same values. Do not publish drafts automatically. Prefer improving the existing canonical article over adding a duplicate question page.

The backlog contains editorial candidates grounded in existing product pages, not observed search queries. Prioritize only after matching Search Console or Naver query evidence. Do not invent search volumes or citations. Keep existing training-crawler decisions separate from search and user-directed fetch controls.

## Measurement

Proposed next review: **2026-10-10**, or 14 days after actual deployment if later. This is a documented review date, not a scheduled automation.

Fill `measurement.csv` from Google Search Console, Bing Webmaster Tools, Naver Search Advisor, and repeatable AI-search observations. Authenticated search-performance metrics and crawler access logs were not collected in this run; blank values mean unavailable, not zero. Compare equivalent date windows and exclude the latest 2–3 incomplete days. Record the exact question, assistant/model, locale, search enabled/disabled, observed source URL, and date for every citation observation. Training-time brand knowledge cannot be inferred from a crawl result; assess it separately each quarter.

After deployment, fetch the canonical homepage, sitemap, robots, feeds, a representative article and a missing URL. Submit the actual sitemap only in an already verified webmaster property. IndexNow requires a key hosted on the correct domain; no key, verification token, or submission is fabricated here. Refresh articles for verified fact changes or a confirmed traffic decline, not just age.

## Scope

Product facts come from the current public site and repository. Search inclusion, ranking improvement, AI citations, and conversions remain unmeasured until post-deployment data is available.
