# kmshack.kr

Personal site of **Minsoo Kim** (김민수 / kmshack) — Android engineer in Seoul.
Portfolio at [kmshack.kr](https://kmshack.kr/), Korean-language Android
engineering blog at [/blog/](https://kmshack.kr/blog/).

Static Jekyll site, built and served by GitHub Pages, proxied through Cloudflare.
No build step to run locally beyond Jekyll itself.

## Layout

```
index.html            home page (hand-written HTML + Liquid)
_posts/               blog posts (Markdown)
_layouts/ _includes/  blog chrome, page shells, JSON-LD, shared page copy
_data/profile.yml     facts about the owner — feeds the API, llms.txt and JSON-LD
_data/api.yml         endpoint catalog — feeds /api/index.json, /developers/ and the tests
api/  openapi.json    the public JSON API and its OpenAPI 3.1 description
about.md contact.md privacy.md developers.md   trust pages (+ their *-md.html twins)
llms.txt llms-full.txt 404.md robots.txt       agent-facing files
cloudflare/           edge Worker for Accept negotiation and JSON errors (optional)
tests/                verification suite
```

Content that exists in both HTML and Markdown lives once in `_includes/content/`
and is included by the page (`about.md` → `/about/`) and by its Markdown twin
(`about-md.html` → `/about.md`).

## Agent-facing surface

| URL | What it is |
| --- | --- |
| [`/llms.txt`](https://kmshack.kr/llms.txt) | Guided index with when-to-use guidance |
| [`/llms-full.txt`](https://kmshack.kr/llms-full.txt) | Every page and post as plain text |
| [`/openapi.json`](https://kmshack.kr/openapi.json) | OpenAPI 3.1 spec for the JSON API |
| [`/api/index.json`](https://kmshack.kr/api/index.json) | API discovery document |
| [`/developers/`](https://kmshack.kr/developers/) | Developer portal |
| `/<page>.md` | Markdown twin of any trust page |

Adding a page that should have a Markdown twin: put the prose in
`_includes/content/<name>.md`, add `<name>.md` (the HTML page) and
`<name>-md.html` (`permalink: /<name>.md`), then list it in `llms.txt`.

## Local development

```bash
gem install jekyll -v 3.10.0 jekyll-feed jekyll-sitemap   # matches GitHub Pages
jekyll serve                                              # http://localhost:4000
```

## Tests

```bash
jekyll build
python3 tests/verify_agent_readiness.py --site _site   # 160 checks on the built output
node --test tests/worker.test.mjs                      # edge negotiation logic
```

Against production, after a deploy:

```bash
python3 tests/verify_agent_readiness.py --base https://kmshack.kr
```

Checks that only the edge Worker can satisfy (`Vary: Accept`, Markdown
negotiation, `406`, JSON error bodies) are reported as warnings until
`cloudflare/markdown-negotiation-worker.js` is deployed — see
[cloudflare/README.md](cloudflare/README.md).

## Deploy

Push to `main`; GitHub Pages builds and publishes.
