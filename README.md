# nascent.com.br

Static site for https://nascent.com.br, served by Deno Deploy (`main.ts`).

- `public/` — the site (AngularJS, html5Mode routes)
- `main.ts` — static files, SPA routes → `index.html`, old `.php` URLs → 302, security headers

Local: `deno task dev` → http://localhost:8000
