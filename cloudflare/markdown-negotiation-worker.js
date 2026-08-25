/**
 * kmshack.kr — edge content negotiation.
 *
 * GitHub Pages serves static files and cannot vary a response on the request's
 * Accept header, so this Worker sits in front of it (the zone is already proxied
 * through Cloudflare) and adds the three things a static host cannot do:
 *
 *   1. `Accept: text/markdown` returns the Markdown twin of a page from the same
 *      canonical URL, with `Content-Type: text/markdown; charset=utf-8`
 *      (acceptmarkdown.com / RFC 9110 content negotiation, q-values honoured).
 *   2. `Vary: Accept` on every negotiated response, so a CDN never hands the
 *      HTML variant to a client that asked for Markdown, or the reverse.
 *   3. Structured JSON error bodies for the /api/ surface and for clients that
 *      ask for JSON, instead of the site's HTML 404 page.
 *
 * A request whose Accept header excludes everything this site can produce gets
 * 406, as the specification requires.
 *
 * Deploy: see cloudflare/README.md.
 */

const SITE = "https://kmshack.kr";
const DOCS_URL = `${SITE}/developers/`;
const MARKDOWN_TYPE = "text/markdown; charset=utf-8";
const LOOP_GUARD = "x-kmshack-negotiated";

export default {
  async fetch(request) {
    // Subrequest issued by this Worker: never negotiate twice.
    if (request.headers.get(LOOP_GUARD)) return fetch(request);

    const url = new URL(request.url);
    const accept = request.headers.get("Accept") || "";
    const ranges = parseAccept(accept);

    // Markdown is only served when the client names `text/markdown` outright:
    // a browser's `*/*` must keep getting HTML, the default representation.
    const wantsMarkdown = quality(ranges, "text/markdown", true);
    const wantsHtml = quality(ranges, "text/html");
    const wantsJson = quality(ranges, "application/json");
    const apiPath = isApiPath(url.pathname);
    const twinPath = markdownTwin(url.pathname);

    // 1. Markdown preferred over HTML, and this path has a Markdown twin.
    if (twinPath && wantsMarkdown > 0 && wantsMarkdown >= wantsHtml) {
      const twin = await origin(request, new URL(twinPath, url));
      if (twin.status === 200) {
        return withHeaders(twin, {
          "Content-Type": MARKDOWN_TYPE,
          Vary: "Accept, Accept-Encoding",
          Link: linkHeader(url, twinPath),
        });
      }
    }

    const upstream = await origin(request, url);

    // 2. Nothing this site can produce is acceptable to the client.
    if (
      accept &&
      wantsHtml === 0 &&
      wantsMarkdown === 0 &&
      wantsJson === 0 &&
      quality(ranges, "*/*") === 0 &&
      isNegotiable(upstream)
    ) {
      return notAcceptable(url, twinPath, apiPath || wantsJson > 0);
    }

    // 3. Structured JSON errors for the API surface and JSON-first clients.
    if (upstream.status >= 400 && (apiPath || prefersJson(ranges))) {
      return jsonError(upstream.status, url);
    }

    // 4. Ordinary HTML: advertise the Markdown twin and vary on Accept.
    if (isNegotiable(upstream)) {
      return withHeaders(upstream, {
        Vary: "Accept, Accept-Encoding",
        ...(twinPath ? { Link: linkHeader(url, twinPath) } : {}),
      });
    }

    return upstream;
  },
};

/** Fetch from the origin with a guard header so we never re-enter this Worker. */
function origin(request, url) {
  const headers = new Headers(request.headers);
  headers.set(LOOP_GUARD, "1");
  return fetch(new Request(url.toString(), { method: request.method, headers, redirect: "manual" }));
}

/** `/` → `/index.md`, `/about/` → `/about.md`; null when the path cannot have a twin. */
export function markdownTwin(pathname) {
  if (pathname === "/") return "/index.md";
  if (pathname.endsWith(".md")) return null;
  if (pathname.endsWith("/")) return `${pathname.slice(0, -1)}.md`;
  if (/\.[a-z0-9]+$/i.test(pathname)) return null;
  return `${pathname}.md`;
}

export function isApiPath(pathname) {
  return pathname.startsWith("/api/") || pathname === "/openapi.json";
}

/** Only HTML and Markdown responses are negotiated; assets pass through untouched. */
function isNegotiable(response) {
  const type = response.headers.get("Content-Type") || "";
  return type.startsWith("text/html") || type.startsWith("text/markdown");
}

/** Parse an Accept header into [{ type, subtype, q }], per RFC 9110 §12.5.1. */
export function parseAccept(header) {
  return header
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [mediaRange, ...params] = part.split(";").map((s) => s.trim());
      const [type = "*", subtype = "*"] = mediaRange.toLowerCase().split("/");
      const qParam = params.find((p) => p.toLowerCase().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
      return { type, subtype, q: Number.isFinite(q) ? Math.min(Math.max(q, 0), 1) : 1 };
    });
}

/**
 * Quality the client assigns to a concrete media type (0 when unacceptable).
 * With `exactOnly`, wildcard ranges are ignored — the type must be named.
 */
export function quality(ranges, mediaType, exactOnly = false) {
  if (ranges.length === 0) return exactOnly ? 0 : 1; // no Accept header: anything goes
  const [type, subtype] = mediaType.split("/");
  let best = -1;
  let bestSpecificity = -1;
  for (const range of ranges) {
    let specificity;
    if (range.type === type && range.subtype === subtype) specificity = 2;
    else if (!exactOnly && range.type === type && range.subtype === "*") specificity = 1;
    else if (!exactOnly && range.type === "*" && range.subtype === "*") specificity = 0;
    else continue;
    if (specificity > bestSpecificity) {
      bestSpecificity = specificity;
      best = range.q;
    }
  }
  return best < 0 ? 0 : best;
}

function prefersJson(ranges) {
  return quality(ranges, "application/json") > quality(ranges, "text/html");
}

function linkHeader(url, twinPath) {
  return `<${new URL(twinPath, url).toString()}>; rel="alternate"; type="text/markdown"`;
}

function withHeaders(response, headers) {
  const merged = new Headers(response.headers);
  for (const [key, value] of Object.entries(headers)) merged.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: merged });
}

function notAcceptable(url, twinPath, asJson) {
  const headers = {
    Vary: "Accept, Accept-Encoding",
    ...(twinPath ? { Link: linkHeader(url, twinPath) } : {}),
  };
  const message = `This URL can be served as text/html${twinPath ? " or text/markdown" : ""}; the Accept header allows neither.`;
  if (asJson) return errorResponse(406, "not_acceptable", message, "Retry with `Accept: application/json` for /api/ paths, or `Accept: text/markdown`.", headers);
  return new Response(`406 Not Acceptable\n\n${message}\n\nSee ${DOCS_URL}\n`, {
    status: 406,
    headers: { "Content-Type": "text/plain; charset=utf-8", ...headers },
  });
}

function jsonError(status, url) {
  if (status === 404) {
    return errorResponse(
      404,
      "not_found",
      `No such resource: ${url.pathname}`,
      "Fetch /api/index.json for the list of available endpoints.",
    );
  }
  if (status === 405) {
    return errorResponse(405, "method_not_allowed", "This API is read-only; use GET.", "Retry the request with GET.");
  }
  return errorResponse(status, "error", `Request failed with status ${status}.`, `See ${DOCS_URL}`);
}

function errorResponse(status, code, message, hint, extraHeaders = {}) {
  const body = { error: { code, message, status, hint, documentation_url: DOCS_URL } };
  return new Response(`${JSON.stringify(body, null, 2)}\n`, {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}
