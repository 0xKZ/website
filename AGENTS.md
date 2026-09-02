# AGENTS.md

Eleventy v3 static site (Nunjucks). `npm start` = dev server, `npm run build` = static build to `_site/`.

- Templates: layouts in `_includes/layouts/`, pages/posts in `content/` (each blog post is a folder in `content/blog/`), site data in `_data/` (zod-validated).
- Custom filters live in `_config/filters.js`; plugins/bundles are wired in `eleventy.config.js`.
- Static assets (css/images) go in `public/` — passed through to site root, not processed by Eleventy.
- Pages get per-page CSS/JS bundles from inline `<style>`/`<script>` tags (opt out with `eleventy:ignore`).
- Posts with `draft: true` are excluded from `build` but shown in `--serve`; use the `draft` front-matter flag for WIP.
- Never push to `gh-pages` manually — pushes to `main` deploy via GitHub Actions (15-min delay by design).
