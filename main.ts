// nascent.com.br — Deno Deploy entrypoint.
// Replaces the express server (portal.js) that ran on EC2.
//
//   /about, /services, ...  SPA routes -> index.html (Angular html5Mode)
//   /<page>.php             302 to the matching route (old PHP site URLs)
//   everything else         static files from ./public

import { serveDir, serveFile } from "jsr:@std/http@1/file-server";

const PUBLIC_DIR = `${import.meta.dirname}/public`;
const INDEX_HTML = `${PUBLIC_DIR}/index.html`;

const SPA_ROUTES = new Set(["/about", "/services", "/projects", "/research", "/contact"]);

const PHP_REDIRECTS: Record<string, string> = {
  "/index.php": "/",
  "/about.php": "/about",
  "/services.php": "/services",
  "/projects.php": "/projects",
  "/research.php": "/research",
  "/contact.php": "/contact",
};

const SECURITY_HEADERS = {
  "strict-transport-security": "max-age=86400; includeSubDomains",
  "x-frame-options": "SAMEORIGIN",
  "x-content-type-options": "nosniff",
  "x-xss-protection": "1; mode=block",
};

async function route(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const { pathname } = url;

  const redirect = PHP_REDIRECTS[pathname];
  if (redirect) return Response.redirect(new URL(redirect, url), 302);

  if (SPA_ROUTES.has(pathname)) return serveFile(req, INDEX_HTML);

  const res = await serveDir(req, { fsRoot: PUBLIC_DIR, quiet: true });
  if (res.status === 404) {
    return new Response("<!doctype html><title>Not Found</title><h1>Not Found</h1>", {
      status: 404,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
  return res;
}

Deno.serve(async (req) => {
  const res = await route(req);
  // Redirect responses have immutable headers, so copy before adding ours.
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
});
