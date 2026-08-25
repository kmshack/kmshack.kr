/**
 * Unit tests for the edge content-negotiation Worker.
 *
 *   node --test tests/
 *
 * The Worker only talks to the origin through the global fetch(), so the tests
 * stub it with a small in-memory site and assert on what comes back out.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import worker, { markdownTwin, parseAccept, quality, isApiPath } from "../cloudflare/markdown-negotiation-worker.js";

const ORIGIN = {
  "/": ["<!doctype html><title>Home</title>", "text/html; charset=utf-8"],
  "/index.md": ["# Minsoo Kim — Android Engineer\n", "text/markdown; charset=utf-8"],
  "/about/": ["<!doctype html><title>About</title>", "text/html; charset=utf-8"],
  "/about.md": ["# About Minsoo Kim\n", "text/markdown; charset=utf-8"],
  "/blog/motionlayout/": ["<!doctype html><title>Post</title>", "text/html; charset=utf-8"],
  "/api/posts.json": ['{"count":35}', "application/json"],
  "/assets/css/style.css": ["body{}", "text/css"],
};

function stubOrigin() {
  globalThis.fetch = async (request) => {
    const path = new URL(request.url).pathname;
    const hit = ORIGIN[path];
    if (!hit) {
      return new Response("<!doctype html><title>404</title>", {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }
    return new Response(hit[0], { status: 200, headers: { "Content-Type": hit[1] } });
  };
}

function get(path, accept) {
  stubOrigin();
  const headers = accept === undefined ? {} : { Accept: accept };
  return worker.fetch(new Request(`https://kmshack.kr${path}`, { headers }));
}

test("Accept parsing keeps q-values and defaults to 1", () => {
  assert.deepEqual(parseAccept("text/html"), [{ type: "text", subtype: "html", q: 1 }]);
  assert.equal(parseAccept("text/markdown;q=0.4")[0].q, 0.4);
  assert.equal(parseAccept("text/html;q=bogus")[0].q, 1);
  assert.equal(parseAccept("text/html;q=9")[0].q, 1, "q is clamped to 1");
});

test("quality resolves exact types, subtype wildcards and */*", () => {
  const ranges = parseAccept("text/markdown;q=0.9, text/*;q=0.5, */*;q=0.1");
  assert.equal(quality(ranges, "text/markdown"), 0.9, "exact match wins");
  assert.equal(quality(ranges, "text/html"), 0.5, "falls back to text/*");
  assert.equal(quality(ranges, "application/json"), 0.1, "falls back to */*");
  assert.equal(quality(parseAccept("text/html"), "application/pdf"), 0, "unlisted type is unacceptable");
  assert.equal(quality(parseAccept(""), "anything/at-all"), 1, "no Accept header accepts everything");
  assert.equal(quality(parseAccept("*/*"), "text/markdown", true), 0, "exactOnly ignores wildcards");
  assert.equal(quality(parseAccept("text/markdown;q=0.3"), "text/markdown", true), 0.3);
});

test("markdown twins map to the page's own path", () => {
  assert.equal(markdownTwin("/"), "/index.md");
  assert.equal(markdownTwin("/about/"), "/about.md");
  assert.equal(markdownTwin("/blog/motionlayout/"), "/blog/motionlayout.md");
  assert.equal(markdownTwin("/about.md"), null, "markdown URLs are already markdown");
  assert.equal(markdownTwin("/api/posts.json"), null, "files with an extension have no twin");
});

test("isApiPath covers the documented API surface", () => {
  assert.equal(isApiPath("/api/posts.json"), true);
  assert.equal(isApiPath("/openapi.json"), true);
  assert.equal(isApiPath("/blog/"), false);
});

test("Accept: text/markdown serves the markdown twin from the same URL", async () => {
  const response = await get("/", "text/markdown");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.match(response.headers.get("Vary"), /\bAccept\b/);
  assert.match(await response.text(), /^# Minsoo Kim/);
});

test("a page URL negotiates markdown too", async () => {
  const response = await get("/about/", "text/markdown, text/html;q=0.5");
  assert.equal(response.headers.get("Content-Type"), "text/markdown; charset=utf-8");
  assert.match(await response.text(), /^# About Minsoo Kim/);
});

test("q-values decide: HTML preferred means HTML served", async () => {
  const response = await get("/", "text/markdown;q=0.5, text/html;q=0.9");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("Content-Type"), /text\/html/);
  assert.match(response.headers.get("Vary"), /\bAccept\b/);
});

test("browsers get HTML, plus Vary and a Link to the markdown twin", async () => {
  const response = await get("/", "text/html,application/xhtml+xml,*/*;q=0.8");
  assert.match(response.headers.get("Content-Type"), /text\/html/);
  assert.match(response.headers.get("Vary"), /\bAccept\b/);
  assert.equal(response.headers.get("Link"), '<https://kmshack.kr/index.md>; rel="alternate"; type="text/markdown"');
});

test("a page without a markdown twin falls back to HTML", async () => {
  const response = await get("/blog/motionlayout/", "text/markdown");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("Content-Type"), /text\/html/);
});

test("an Accept header we cannot satisfy gets 406", async () => {
  const response = await get("/", "application/pdf");
  assert.equal(response.status, 406);
  assert.match(response.headers.get("Vary"), /\bAccept\b/);
});

test("missing API resources return a structured JSON error", async () => {
  const response = await get("/api/unknown.json", "application/json");
  assert.equal(response.status, 404);
  assert.match(response.headers.get("Content-Type"), /application\/json/);
  const body = await response.json();
  assert.equal(body.error.code, "not_found");
  assert.equal(body.error.status, 404);
  assert.equal(body.error.message, "No such resource: /api/unknown.json");
  assert.ok(body.error.hint.includes("/api/index.json"));
  assert.equal(body.error.documentation_url, "https://kmshack.kr/developers/");
});

test("API 404s are JSON even when the client sends a browser Accept header", async () => {
  const response = await get("/api/unknown.json", "text/html,*/*;q=0.8");
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, "not_found");
});

test("existing API documents pass through untouched", async () => {
  const response = await get("/api/posts.json", "application/json");
  assert.equal(response.status, 200);
  assert.equal((await response.json()).count, 35);
});

test("assets are never rewritten or given a Vary header", async () => {
  const response = await get("/assets/css/style.css", "text/css,*/*;q=0.1");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Vary"), null);
  assert.equal(await response.text(), "body{}");
});

test("a request with no Accept header gets HTML, the default representation", async () => {
  const response = await get("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("Content-Type"), /text\/html/);
});

test("Accept: */* gets HTML — markdown must be asked for by name", async () => {
  const response = await get("/", "*/*");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("Content-Type"), /text\/html/);
});
