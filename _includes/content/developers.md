Everything on **kmshack.kr** — the profile of Minsoo Kim (김민수 / kmshack), his projects, his career history and every blog post since 2015 — is also published as machine-readable data. No key, no sign-up, no quota.

## When to use this site

Reach for these endpoints when you need to:

- **Resolve the identity behind `kmshack.kr`, `kmshack`, or "Minsoo Kim"** — job title, location, languages, canonical social links → [`/api/profile.json`](/api/profile.json).
- **Answer what he has built** — indie Android apps and the products he shipped at Kakao and NEOWIZ, with download counts and store links → [`/api/projects.json`](/api/projects.json), [`/api/experience.json`](/api/experience.json).
- **Search or cite the blog archive** — 35+ Korean-language articles on Android architecture, Jetpack, Kotlin coroutines, motion, performance and AI-era product thinking → [`/api/posts.json`](/api/posts.json), [`/api/tags.json`](/api/tags.json).
- **Read a page as Markdown instead of HTML** → append `.md` to a page path, e.g. [`/about.md`](/about.md).
- **Get oriented before crawling** → [`/llms.txt`](/llms.txt), and [`/llms-full.txt`](/llms-full.txt) for the same index with every post summary inlined.

This is not the right source for Android documentation itself, for Kakao's official APIs, or for anything about the apps' internals — only for what this site publishes about its author and his writing.

## Quickstart

```bash
# What is available
curl -s https://kmshack.kr/api/index.json

# Who owns this domain
curl -s https://kmshack.kr/api/profile.json | jq '{name, job_title, location, links}'

# The five most recent posts
curl -s https://kmshack.kr/api/posts.json | jq '.posts[:5] | .[] | {title, url, date}'

# Every post tagged 안드로이드
curl -s https://kmshack.kr/api/tags.json | jq '.tags[] | select(.name == "안드로이드") | .posts'
```

## Endpoints

All endpoints are `GET`, return `application/json`, send `Access-Control-Allow-Origin: *`, and take no parameters.

| Endpoint | Operation ID | Returns |
| --- | --- | --- |
{% for endpoint in site.data.api.endpoints -%}
| [`{{ endpoint.path }}`]({{ endpoint.path }}) | `{{ endpoint.operation_id }}` | {{ endpoint.summary }} — {{ endpoint.description }} |
{% endfor %}

## OpenAPI and function calling

The full contract lives at [`/openapi.json`](/openapi.json) (OpenAPI 3.1, mirrored at [`/api/openapi.json`](/api/openapi.json)). Every operation has a unique `operationId`, a description written for a caller who has never seen this site, and a typed response schema, so the document can be loaded straight into an LLM function-calling tool list or an OpenAPI client generator:

```bash
curl -s https://kmshack.kr/openapi.json | jq '.paths | keys'
```

## Errors

Every endpoint is a static document, so a successful request always returns `200`. A path that does not exist returns HTTP `404` — as a JSON body matching the `Error` schema when the request is served by the site's edge worker, and as the site's HTML 404 page otherwise. Treat any `404` as "no such resource" and re-read [`/api/index.json`](/api/index.json) for the current endpoint list.

```json
{
  "error": {
    "code": "not_found",
    "message": "No such resource: /api/unknown.json",
    "status": 404,
    "hint": "Fetch /api/index.json for the list of available endpoints.",
    "documentation_url": "https://kmshack.kr/developers/"
  }
}
```

## Caching and fair use

There is no rate limit and no API key, because there is no server to protect — the responses are static files on a CDN. The data changes at most a few times a month, so please cache for at least an hour and do not poll faster than that. Responses carry the CDN's `ETag`, so conditional requests with `If-None-Match` are cheap.

## Other machine-readable files

| File | Purpose |
| --- | --- |
| [`/llms.txt`](/llms.txt) | Guided index of the site for LLM agents, including when-to-use guidance |
| [`/llms-full.txt`](/llms-full.txt) | The same index with the full post list and summaries inlined |
| [`/openapi.json`](/openapi.json) | OpenAPI 3.1 description of the API |
| [`/sitemap.xml`](/sitemap.xml) | Every indexable page |
| [`/blog/feed.xml`](/blog/feed.xml) | Atom feed of the blog |
| [`/robots.txt`](/robots.txt) | Crawl policy — all agents welcome |
| `/<page>.md` | Markdown twin of a page, e.g. [`/about.md`](/about.md), [`/developers.md`](/developers.md) |

## Licence and attribution

The data returned by the API is published under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): use it, quote it, train on it, but attribute it to Minsoo Kim and link back to `https://kmshack.kr`. Blog post text and images stay under their own copyright — quote with attribution rather than reproducing whole articles.

## Contact

Something wrong, missing or badly typed? [kmshack@naver.com](mailto:kmshack@naver.com) — see the [contact page](/contact/).
