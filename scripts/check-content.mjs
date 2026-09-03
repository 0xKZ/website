#!/usr/bin/env node
/**
 * Content sanity checks. Run after `npm run build`:
 *   npm run check:content
 *
 * Checks (source + built output):
 *  - every blog post has front matter with a non-empty `title` and an
 *    ISO-format `date`
 *  - no two pages generate the same URL (duplicate <loc> in sitemap.xml)
 *  - every sitemap entry has a non-empty <lastmod> (catches unparseable dates)
 *  - no draft content leaked into the production build
 *  - feed.xml and sitemap.xml exist and are structurally well-formed
 */

import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = join(rootDir, "_site");
const blogDir = join(rootDir, "content", "blog");

if (!existsSync(siteDir)) {
	console.error("error: no _site directory found. Run `npm run build` first.");
	process.exit(1);
}

const failures = [];
const fail = (where, message) => failures.push(`  ${where}  ${message}`);

// --- 1. Blog post front matter ------------------------------------------------

function walk(dir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) walk(full, out);
		else if (entry.name.endsWith(".md")) out.push(full);
	}
	return out;
}

function frontMatter(file) {
	const content = readFileSync(file, "utf8");
	// Front matter is the block between the leading "---" line and the next "---"
	const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/);
	return match ? match[1] : null;
}

const postFiles = walk(blogDir);
for (const file of postFiles) {
	const rel = relative(rootDir, file);
	const fm = frontMatter(file);
	if (fm === null) {
		fail(rel, "has no front matter block");
		continue;
	}
	const title = fm.match(/^title:\s*(.*)$/m);
	const date = fm.match(/^date:\s*(.*)$/m);
	if (!title || title[1].trim() === "") {
		fail(rel, "missing non-empty `title:` in front matter");
	}
	if (!date || !/^\d{4}-\d{2}-\d{2}/.test(date[1].trim())) {
		fail(rel, "missing `date:` (YYYY-MM-DD) in front matter");
	}
}

// --- 2. Sitemap: duplicates, lastmod -------------------------------------------

const sitemapPath = join(siteDir, "sitemap.xml");
if (!existsSync(sitemapPath) || statSync(sitemapPath).size === 0) {
	fail("_site/sitemap.xml", "missing or empty");
} else {
	const sitemap = readFileSync(sitemapPath, "utf8");
	if (!/<urlset[\s>]/.test(sitemap) || !/\/urlset>/.test(sitemap)) {
		fail("_site/sitemap.xml", "does not look like a valid sitemap (no <urlset>)");
	}

	const urls = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
	if (urls.length === 0) {
		fail("_site/sitemap.xml", "contains no <url> entries");
	}

	const locs = [...sitemap.matchAll(/<loc>\s*([^<]*?)\s*<\/loc>/g)].map((m) => m[1]);
	const seen = new Map();
	for (const loc of locs) {
		if (seen.has(loc)) fail("sitemap.xml", `duplicate URL: ${loc}`);
		seen.set(loc, true);
	}

	for (const [i, block] of urls.entries()) {
		const lastmod = block.match(/<lastmod>\s*([^<]*?)\s*<\/lastmod>/);
		if (!lastmod || lastmod[1] === "") {
			const loc = block.match(/<loc>\s*([^<]*?)\s*<\/loc>/);
			fail("sitemap.xml", `entry ${i + 1} (${loc ? loc[1] : "?"}) has no <lastmod> — check the post's date`);
		}
	}
}

// --- 3. No drafts in the production build ---------------------------------------

function walkHtml(dir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) walkHtml(full, out);
		else if (entry.name.endsWith(".html")) out.push(full);
	}
	return out;
}

for (const file of walkHtml(siteDir)) {
	const titleMatch = readFileSync(file, "utf8").match(/<title>([^<]*)<\/title>/);
	if (titleMatch && titleMatch[1].includes("(draft)")) {
		fail(relative(rootDir, file), `draft content in production build: <title>${titleMatch[1]}</title>`);
	}
}

// --- 4. Feed ---------------------------------------------------------------------

const feedPath = join(siteDir, "feed", "feed.xml");
if (!existsSync(feedPath) || statSync(feedPath).size === 0) {
	fail("_site/feed/feed.xml", "missing or empty");
} else {
	const feed = readFileSync(feedPath, "utf8");
	if (!/<feed[\s>]/.test(feed) || !/\/feed>/.test(feed)) {
		fail("_site/feed/feed.xml", "does not look like a valid Atom feed (no <feed> root)");
	}
	const entries = feed.match(/<entry[\s>]/g);
	if (!entries || entries.length === 0) {
		fail("_site/feed/feed.xml", "contains no <entry> elements");
	}
}

// --- Report ------------------------------------------------------------------------

if (failures.length === 0) {
	console.log(
		`check-content: OK (${postFiles.length} posts, ${locsCount(sitemapPath)} sitemap URLs, feed + sitemap well-formed)`
	);
	process.exit(0);
}

console.error(`check-content: ${failures.length} problem(s) found:\n`);
for (const f of failures) console.error(f);
process.exit(1);

function locsCount(p) {
	if (!existsSync(p)) return 0;
	const m = readFileSync(p, "utf8").match(/<loc>/g);
	return m ? m.length : 0;
}
