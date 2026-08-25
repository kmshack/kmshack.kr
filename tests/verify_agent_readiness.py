#!/usr/bin/env python3
"""Verify the agent-facing surface of kmshack.kr.

Runs against a Jekyll build directory (default) or a live origin:

    python3 tests/verify_agent_readiness.py --site _site
    python3 tests/verify_agent_readiness.py --base https://kmshack.kr

Checks that survive only at the edge (Vary: Accept, JSON error bodies, 406) are
reported as warnings unless --strict is passed; see cloudflare/README.md.
Exit code is 1 if any check fails.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request

SITE = "https://kmshack.kr"
API_ENDPOINTS = [
    "/api/index.json",
    "/api/profile.json",
    "/api/projects.json",
    "/api/experience.json",
    "/api/posts.json",
    "/api/tags.json",
    "/openapi.json",
    "/api/openapi.json",
]
TRUST_PAGES = ["/about/", "/contact/", "/privacy/", "/developers/"]
MARKDOWN_TWINS = ["/index.md", "/about.md", "/contact.md", "/privacy.md", "/developers.md"]
MISSING_PATH = "/some-path-that-does-not-exist"

results: list[tuple[str, str, str]] = []


def record(status: str, name: str, detail: str = "") -> bool:
    results.append((status, name, detail))
    return status != "FAIL"


def check(name: str, condition: bool, detail: str = "") -> bool:
    return record("PASS" if condition else "FAIL", name, detail)


def warn(name: str, condition: bool, detail: str = "") -> bool:
    return record("PASS" if condition else "WARN", name, detail)


def lower_keys(headers) -> dict:
    """HTTP header names are case-insensitive; HTTP/2 sends them lower-cased."""
    return {key.lower(): value for key, value in headers.items()}


class Fetcher:
    """Reads site resources from a build directory or over HTTP."""

    def __init__(self, site_dir: str | None, base_url: str | None):
        self.site_dir = site_dir
        self.base_url = base_url.rstrip("/") if base_url else None

    @property
    def live(self) -> bool:
        return self.base_url is not None

    def get(self, path: str, accept: str | None = None):
        """Return (status, headers, text). Status is None when unknowable."""
        if self.live:
            request = urllib.request.Request(self.base_url + path)
            request.add_header("User-Agent", "kmshack-agent-readiness-check/1.0")
            if accept:
                request.add_header("Accept", accept)
            try:
                with urllib.request.urlopen(request, timeout=30) as response:
                    return response.status, lower_keys(response.headers), response.read().decode("utf-8", "replace")
            except urllib.error.HTTPError as error:
                return error.code, lower_keys(error.headers), error.read().decode("utf-8", "replace")
            except OSError as error:
                return 0, {}, f"{error}"
        local = self._local_path(path)
        if local and os.path.isfile(local):
            with open(local, encoding="utf-8", errors="replace") as handle:
                return 200, {}, handle.read()
        return 404, {}, ""

    def _local_path(self, path: str) -> str | None:
        if not self.site_dir:
            return None
        relative = path.lstrip("/")
        if path.endswith("/") or path == "":
            relative = os.path.join(relative, "index.html")
        return os.path.join(self.site_dir, relative)


def text_of(html: str) -> str:
    body = re.sub(r"(?is)<(script|style)\b.*?</\1>", " ", html)
    body = re.sub(r"(?s)<[^>]+>", " ", body)
    return re.sub(r"\s+", " ", body).strip()


def json_ld_blocks(html: str) -> list:
    blocks = []
    for raw in re.findall(r'(?is)<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>', html):
        try:
            blocks.append(json.loads(raw))
        except json.JSONDecodeError as error:
            record("FAIL", "homepage JSON-LD parses", str(error))
    return blocks


def meta_content(html: str, attribute: str, value: str) -> str | None:
    match = re.search(
        r'(?is)<meta[^>]+%s=["\']%s["\'][^>]*content=["\'](.*?)["\']' % (attribute, re.escape(value)), html
    )
    if match:
        return match.group(1)
    match = re.search(
        r'(?is)<meta[^>]+content=["\'](.*?)["\'][^>]*%s=["\']%s["\']' % (attribute, re.escape(value)), html
    )
    return match.group(1) if match else None


# --------------------------------------------------------------------------- checks


def check_404(fetcher: Fetcher) -> None:
    if fetcher.live:
        status, _, body = fetcher.get(MISSING_PATH)
        check("404: nonexistent path returns HTTP 404", status == 404, f"got {status}")
    else:
        status, _, body = fetcher.get("/404.html")
        check("404: /404.html is built", status == 200)
    lowered = body.lower()
    check("404: body links to the sitemap", "sitemap.xml" in lowered)
    check("404: body links to llms.txt", "llms.txt" in lowered)
    check("404: body links to the API index", "api/index.json" in lowered)
    check(
        "404: body carries a markdown recovery block",
        "- [llms.txt](https://kmshack.kr/llms.txt)" in body,
    )
    check("404: body points at the blog archive", "/blog/archive/" in body)


def check_openapi(fetcher: Fetcher, catalog: list[dict]) -> dict | None:
    status, _, body = fetcher.get("/openapi.json")
    if not check("openapi: /openapi.json is served", status == 200, f"got {status}"):
        return None
    try:
        spec = json.loads(body)
    except json.JSONDecodeError as error:
        check("openapi: /openapi.json is valid JSON", False, str(error))
        return None
    check("openapi: /openapi.json is valid JSON", True)

    mirror_status, _, mirror_body = fetcher.get("/api/openapi.json")
    check("openapi: /api/openapi.json mirrors the spec", mirror_status == 200 and mirror_body == body)

    check("openapi: version is 3.1.x", str(spec.get("openapi", "")).startswith("3.1"))
    info = spec.get("info", {})
    check("openapi: info has title, version and description", all(info.get(k) for k in ("title", "version", "description")))
    check("openapi: info has contact and license", bool(info.get("contact")) and bool(info.get("license")))
    check("openapi: declares a server", bool(spec.get("servers")) and spec["servers"][0].get("url") == SITE)
    check("openapi: links to external docs", bool(spec.get("externalDocs", {}).get("url")))

    operations = [(path, method, op) for path, item in spec.get("paths", {}).items() for method, op in item.items()]
    check("openapi: describes at least one operation", bool(operations))
    ids = [op.get("operationId") for _, _, op in operations]
    check("openapi: every operation has an operationId", all(ids))
    check("openapi: operationIds are unique", len(ids) == len(set(ids)), f"{len(ids)} ids, {len(set(ids))} unique")
    check(
        "openapi: every operation has a description",
        all((op.get("description") or "").strip() for _, _, op in operations),
    )
    check("openapi: every operation has a summary", all((op.get("summary") or "").strip() for _, _, op in operations))
    check(
        "openapi: every operation is tagged",
        all(op.get("tags") for _, _, op in operations),
    )

    typed_responses = True
    documented_errors = True
    for _, _, op in operations:
        responses = op.get("responses", {})
        ok = responses.get("200", {})
        schema = ok.get("content", {}).get("application/json", {}).get("schema")
        typed_responses = typed_responses and bool(schema)
        documented_errors = documented_errors and "404" in responses
    check("openapi: every 200 response has a JSON schema", typed_responses)
    check("openapi: every operation documents its 404", documented_errors)

    schemas = spec.get("components", {}).get("schemas", {})
    check("openapi: components.schemas is populated", len(schemas) >= 10, f"{len(schemas)} schemas")
    check(
        "openapi: every schema is typed and described",
        all(s.get("type") and s.get("description") for s in schemas.values()),
    )
    error_schema = schemas.get("Error", {}).get("properties", {}).get("error", {}).get("properties", {})
    check(
        "openapi: Error schema carries code, message, status and hint",
        all(field in error_schema for field in ("code", "message", "status", "hint")),
    )
    check("openapi: rate-limit guidance is published", bool(spec.get("x-rate-limit")))

    spec_paths = set(spec.get("paths", {}))
    catalog_paths = {entry["path"] for entry in catalog}
    check(
        "openapi: spec and _data/api.yml describe the same endpoints",
        spec_paths == catalog_paths,
        f"spec only: {sorted(spec_paths - catalog_paths)} · catalog only: {sorted(catalog_paths - spec_paths)}",
    )
    catalog_ids = {entry["operation_id"] for entry in catalog}
    check("openapi: operationIds match the catalog", set(ids) == catalog_ids)
    return spec


def check_api(fetcher: Fetcher) -> None:
    for path in API_ENDPOINTS:
        status, headers, body = fetcher.get(path)
        if not check(f"api: {path} is served", status == 200, f"got {status}"):
            continue
        try:
            payload = json.loads(body)
        except json.JSONDecodeError as error:
            check(f"api: {path} is valid JSON", False, str(error))
            continue
        check(f"api: {path} is valid JSON", True)
        check(f"api: {path} is not empty", bool(payload))
        if fetcher.live:
            content_type = headers.get("content-type", "")
            check(f"api: {path} is served as JSON", "json" in content_type.lower(), content_type)
            check(
                f"api: {path} allows cross-origin reads",
                headers.get("access-control-allow-origin") == "*",
                headers.get("access-control-allow-origin", "missing"),
            )

    _, _, index_body = fetcher.get("/api/index.json")
    index = json.loads(index_body)
    check("api: index lists every endpoint", len(index.get("endpoints", [])) >= 7)
    check("api: index states the auth scheme", index.get("auth") == "none")
    check("api: index links to the OpenAPI spec", index.get("openapi") == f"{SITE}/openapi.json")
    check("api: index links to llms.txt", index.get("llms_txt") == f"{SITE}/llms.txt")
    check("api: index publishes rate-limit guidance", bool(index.get("rate_limit")))

    _, _, profile_body = fetcher.get("/api/profile.json")
    profile = json.loads(profile_body)
    for field in ("name", "job_title", "location", "languages", "links", "skills", "email", "url"):
        check(f"api: profile has {field}", bool(profile.get(field)))

    _, _, posts_body = fetcher.get("/api/posts.json")
    posts = json.loads(posts_body)
    check("api: posts.json reports a count that matches its list", posts.get("count") == len(posts.get("posts", [])))
    check("api: posts.json is non-empty", len(posts.get("posts", [])) > 0)
    required = {"id", "title", "url", "date", "modified", "tags", "summary", "language", "legacy"}
    check(
        "api: every post carries the documented fields",
        all(required <= set(post) for post in posts.get("posts", [])),
    )
    check(
        "api: every post URL is absolute",
        all(post["url"].startswith(SITE + "/blog/") for post in posts.get("posts", [])),
    )
    ids = [post["id"] for post in posts.get("posts", [])]
    check("api: post ids are unique", len(ids) == len(set(ids)))

    _, _, tags_body = fetcher.get("/api/tags.json")
    tags = json.loads(tags_body)
    check("api: tags.json reports a count that matches its list", tags.get("count") == len(tags.get("tags", [])))
    known = set(ids)
    check(
        "api: tag members resolve to known posts",
        all(set(tag.get("posts", [])) <= known for tag in tags.get("tags", [])),
    )


def check_llms(fetcher: Fetcher) -> None:
    status, _, body = fetcher.get("/llms.txt")
    if not check("llms.txt: served", status == 200, f"got {status}"):
        return
    lines = body.splitlines()
    check("llms.txt: starts with a single H1", bool(lines) and lines[0].startswith("# "))
    check("llms.txt: has exactly one H1", sum(1 for line in lines if line.startswith("# ")) == 1)
    blockquote = next((line for line in lines[1:6] if line.startswith("> ")), None)
    check("llms.txt: H1 is followed by a blockquote summary", bool(blockquote))
    check("llms.txt: summary is substantial", bool(blockquote) and len(blockquote) > 120)
    sections = [line for line in lines if line.startswith("## ")]
    check("llms.txt: has H2 sections", len(sections) >= 3, f"{len(sections)} sections")
    check("llms.txt: keeps headings at H1/H2", not any(line.startswith("### ") for line in lines))
    check("llms.txt: includes an Optional section", "## Optional" in body)

    in_section = False
    malformed = []
    for line in lines:
        if line.startswith("## "):
            in_section = True
            continue
        if in_section and line.startswith("- ") and not re.match(r"- \[[^\]]+\]\(https?://[^)]+\)", line):
            malformed.append(line)
    check("llms.txt: every list item under an H2 is a link", not malformed, "; ".join(malformed[:3]))

    lowered = body.lower()
    check("llms.txt: tells agents when to use the site", "use this site when" in lowered)
    check("llms.txt: tells agents when not to use it", "do not use it" in lowered)
    check("llms.txt: links the API", "/api/index.json" in body and "/openapi.json" in body)
    check("llms.txt: links the markdown twins", "/about.md" in body)

    status, _, full = fetcher.get("/llms-full.txt")
    check("llms-full.txt: served", status == 200, f"got {status}")
    check("llms-full.txt: contains the full archive", len(full) > 100_000, f"{len(full)} bytes")
    check("llms-full.txt: starts with a single H1", full.startswith("# "))


def check_robots(fetcher: Fetcher) -> None:
    status, _, body = fetcher.get("/robots.txt")
    if not check("robots.txt: served", status == 200, f"got {status}"):
        return
    check("robots.txt: points at the sitemap", f"Sitemap: {SITE}/sitemap.xml" in body)
    check("robots.txt: allows every crawler", re.search(r"(?m)^User-agent: \*\s*$", body) and "Allow: /" in body)
    check("robots.txt: points agents at llms.txt", "llms.txt" in body)


def check_homepage(fetcher: Fetcher) -> None:
    status, headers, html = fetcher.get("/")
    if not check("homepage: served", status == 200, f"got {status}"):
        return
    check("metadata: html lang is declared", bool(re.search(r'(?i)<html[^>]+lang="[a-z-]+"', html)))
    canonical = re.search(r'(?i)<link[^>]+rel="canonical"[^>]+href="([^"]+)"', html)
    check("metadata: canonical URL", bool(canonical) and canonical.group(1) == f"{SITE}/")
    check("metadata: og:type", meta_content(html, "property", "og:type") == "website")
    og_image = meta_content(html, "property", "og:image")
    check("metadata: og:image is absolute", bool(og_image) and og_image.startswith("https://"))
    check("metadata: og:url", meta_content(html, "property", "og:url") == f"{SITE}/")
    check("metadata: og:title and og:description", bool(meta_content(html, "property", "og:title")) and bool(meta_content(html, "property", "og:description")))
    check("metadata: twitter card", bool(meta_content(html, "name", "twitter:card")))
    description = meta_content(html, "name", "description")
    check("metadata: description is present and sized", bool(description) and 50 <= len(description) <= 200, f"{len(description or '')} chars")
    check("metadata: names the brand in the title", bool(re.search(r"(?is)<title>.*kmshack.*</title>", html)))
    check("metadata: advertises the markdown twin", 'rel="alternate" type="text/markdown"' in html)

    blocks = json_ld_blocks(html)
    check("json-ld: present on the homepage", bool(blocks))
    types = set()
    person = None
    for block in blocks:
        for node in block.get("@graph", [block]):
            node_type = node.get("@type")
            types.add(node_type)
            if node_type == "Person":
                person = node
    check("json-ld: declares a Person", "Person" in types)
    check("json-ld: declares a WebSite", "WebSite" in types)
    check("json-ld: declares a ProfilePage", "ProfilePage" in types)
    if person:
        for field in ("name", "url", "description", "jobTitle", "image", "sameAs", "email"):
            check(f"json-ld: Person has {field}", bool(person.get(field)))
        check("json-ld: Person.sameAs lists profiles", len(person.get("sameAs", [])) >= 3)

    if og_image:
        image_path = og_image.replace(SITE, "")
        image_status, _, _ = fetcher.get(image_path)
        check("metadata: og:image resolves", image_status == 200, f"{image_path} -> {image_status}")


def check_trust_pages(fetcher: Fetcher) -> None:
    for path in TRUST_PAGES:
        status, _, html = fetcher.get(path)
        if not check(f"trust: {path} is served", status == 200, f"got {status}"):
            continue
        body = text_of(html)
        check(f"trust: {path} has substantial content", len(body) >= 500, f"{len(body)} chars")
        check(f"trust: {path} declares a canonical URL", 'rel="canonical"' in html)
    _, _, privacy = fetcher.get("/privacy/")
    privacy_text = text_of(privacy).lower()
    for term in ("analytics", "cookie", "localstorage", "github pages", "cloudflare"):
        check(f"trust: privacy notice covers {term}", term in privacy_text)
    address = "kmshack@naver.com"
    _, _, contact = fetcher.get("/contact/")
    _, _, contact_md = fetcher.get("/contact.md")
    _, _, profile_json = fetcher.get("/api/profile.json")
    check(
        "trust: a contact address is machine-readable",
        address in contact_md and address in profile_json,
    )
    warn(
        "trust: contact page publishes the address in its HTML",
        address in contact,
        "Cloudflare Scrape Shield rewrites mailto links into /cdn-cgi/l/email-protection; "
        "the address stays readable in /contact.md, /api/profile.json and the home page JSON-LD",
    )


def check_markdown(fetcher: Fetcher) -> None:
    for path in MARKDOWN_TWINS:
        status, headers, body = fetcher.get(path)
        if not check(f"markdown: {path} is served", status == 200, f"got {status}"):
            continue
        check(f"markdown: {path} starts with an H1", body.lstrip().startswith("# "))
        check(f"markdown: {path} is not HTML", "<!DOCTYPE html>" not in body and "<html" not in body)
        check(f"markdown: {path} names its canonical URL", "kmshack.kr" in body)
        if fetcher.live:
            content_type = headers.get("content-type", "")
            warn(
                f"markdown: {path} is served as text/markdown",
                "markdown" in content_type.lower(),
                f"got {content_type or 'nothing'} — the CDN's mime table decides; the edge worker overrides it",
            )

    if not fetcher.live:
        return

    status, headers, body = fetcher.get("/", accept="text/markdown")
    content_type = headers.get("content-type", "")
    warn(
        "markdown: Accept: text/markdown returns markdown from /",
        "markdown" in content_type.lower(),
        f"got {content_type or 'nothing'} — deploy cloudflare/markdown-negotiation-worker.js",
    )
    warn(
        "markdown: Vary includes Accept",
        "accept" in headers.get("vary", "").lower().replace("accept-encoding", ""),
        f"got Vary: {headers.get('vary', 'missing')} — deploy cloudflare/markdown-negotiation-worker.js",
    )
    status, _, _ = fetcher.get("/", accept="application/pdf")
    warn("markdown: unsatisfiable Accept returns 406", status == 406, f"got {status}")

    status, headers, body = fetcher.get("/api/does-not-exist.json", accept="application/json")
    is_json = "json" in headers.get("content-type", "").lower()
    warn(
        "api: missing resources return a JSON error body",
        status == 404 and is_json,
        f"got {status} {headers.get('content-type', '')} — deploy cloudflare/markdown-negotiation-worker.js",
    )
    if is_json:
        try:
            error = json.loads(body).get("error", {})
            warn("api: JSON error carries code, message and hint", all(k in error for k in ("code", "message", "status", "hint")))
        except json.JSONDecodeError:
            warn("api: JSON error body parses", False)


def check_sitemap(fetcher: Fetcher) -> None:
    status, _, body = fetcher.get("/sitemap.xml")
    if not check("sitemap: served", status == 200, f"got {status}"):
        return
    for path in TRUST_PAGES:
        check(f"sitemap: lists {path}", f"{SITE}{path}" in body)
    check("sitemap: omits the 404 page", "/404.html" not in body)
    check("sitemap: omits markdown twins", "/about.md" not in body)


def load_catalog() -> list[dict]:
    """Minimal reader for the endpoint list in _data/api.yml (no PyYAML needed)."""
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    entries: list[dict] = []
    with open(os.path.join(root, "_data", "api.yml"), encoding="utf-8") as handle:
        in_endpoints = False
        for line in handle:
            if line.startswith("endpoints:"):
                in_endpoints = True
                continue
            if not in_endpoints:
                continue
            match = re.match(r'\s*-?\s*(path|operation_id):\s*"(.*)"', line)
            if not match:
                continue
            key, value = match.groups()
            if key == "path":
                entries.append({"path": value})
            elif entries:
                entries[-1]["operation_id"] = value
    return entries


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--site", default="_site", help="Jekyll build directory to check (default: _site)")
    parser.add_argument("--base", help="Live origin to check instead, e.g. https://kmshack.kr")
    parser.add_argument("--strict", action="store_true", help="Treat warnings as failures")
    args = parser.parse_args()

    if args.base:
        fetcher = Fetcher(None, args.base)
        target = args.base
    else:
        if not os.path.isdir(args.site):
            print(f"Build directory not found: {args.site}\nRun `jekyll build` first, or pass --base.", file=sys.stderr)
            return 2
        fetcher = Fetcher(args.site, None)
        target = args.site

    catalog = load_catalog()
    check_404(fetcher)
    check_openapi(fetcher, catalog)
    check_api(fetcher)
    check_llms(fetcher)
    check_robots(fetcher)
    check_homepage(fetcher)
    check_trust_pages(fetcher)
    check_markdown(fetcher)
    check_sitemap(fetcher)

    failures = [r for r in results if r[0] == "FAIL"]
    warnings = [r for r in results if r[0] == "WARN"]
    for status, name, detail in results:
        if status == "PASS":
            continue
        print(f"{status}  {name}" + (f"  ({detail})" if detail else ""))
    print(f"\n{len(results) - len(failures) - len(warnings)} passed, {len(warnings)} warned, {len(failures)} failed  [{target}]")
    if warnings and not args.strict:
        print("Warnings are edge behaviours; see cloudflare/README.md.")
    return 1 if failures or (warnings and args.strict) else 0


if __name__ == "__main__":
    sys.exit(main())
