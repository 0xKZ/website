#!/usr/bin/env node
/**
 * Check the built site (_site) for broken internal links.
 *
 * Scans every .html file (plus sitemap.xml / feed.xml) for href/src/srcset
 * attributes and verifies that internal references resolve to real files in
 * _site. External links (http/https to other sites) are skipped.
 *
 * Run after `npm run build`:
 *   npm run check:links
 */

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const siteDir = join(rootDir, "_site");
const siteUrl = (await import("../_data/metadata.js")).default.url; // e.g. https://zachkehs.com/

if (!existsSync(siteDir)) {
	console.error("error: no _site directory found. Run `npm run build` first.");
	process.exit(1);
}

// --- Collect files to scan -------------------------------------------------

const scanFiles = [];
function walk(dir) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			walk(full);
		} else if ([".html", ".xml"].includes(extname(entry.name))) {
			scanFiles.push(full);
		}
	}
}
walk(siteDir);

// --- Extract link targets ---------------------------------------------------

// href="..." / src="..." (this site's generated HTML is consistently double-quoted)
const attrRe = /(?:href|src)="([^"]*)"/g;
// srcset="url1 desc1, url2 desc2"
const srcsetRe = /srcset="([^"]*)"/g;
// sitemap/feed <loc>...</loc> and <link href="...">
const locRe = /<loc>\s*([^<]+?)\s*<\/loc>/g;

function lineOf(content, index) {
	let line = 1;
	for (let i = 0; i < index; i++) if (content[i] === "\n") line++;
	return line;
}

function extractTargets(file, content) {
	const targets = [];
	for (const re of [attrRe, srcsetRe, locRe]) {
		re.lastIndex = 0;
		for (const match of content.matchAll(re)) {
			const value = match[1];
			const line = lineOf(content, match.index);
			if (re === srcsetRe) {
				// Each candidate is "url [width/height descriptor]"
				for (const candidate of value.split(",")) {
					const url = candidate.trim().split(/\s+/)[0];
					if (url) targets.push({ url, line });
				}
			} else {
				targets.push({ url: value.trim(), line });
			}
		}
	}
	return targets;
}

// --- Resolve and verify ------------------------------------------------------

// Links we don't check: other sites, email, etc.
const skipRe = /^(?:[a-z][a-z0-9+.-]*:|#)/i; // any scheme (http:, https:, mailto:, data:...) or pure fragment

// Absolute URLs to this site (e.g. canonical/OG tags, sitemap) are internal.
let siteOrigin;
try {
	siteOrigin = new URL(siteUrl).origin; // https://zachkehs.com
} catch {
	siteOrigin = null;
}

function resolveInternal(url, file) {
	// Strip fragment and query string
	const path = url.split(/[?#]/)[0];
	if (path === "") return null; // pure fragment or ?query

	// Absolute URL to our own site (e.g. canonical/OG tags, sitemap) is internal
	let p = path;
	if (siteOrigin && p.startsWith(siteOrigin)) p = p.slice(siteOrigin.length);

	try {
		p = decodeURIComponent(p);
	} catch {
		/* leave as-is */
	}

	if (p.startsWith("/")) {
		return join(siteDir, p);
	}
	// Relative reference (not used by this site currently, but be robust)
	return join(dirname(file), p);
}

function fileExists(target) {
	// A link to /about/ means /about/index.html; /about means /about.html or /about/index.html
	const candidates = target.endsWith("/")
		? [join(target, "index.html")]
		: [target, `${target}.html`, join(target, "index.html")];
	return candidates.some((c) => {
		try {
			return statSync(c).isFile();
		} catch {
			return false;
		}
	});
}

// --- Run ----------------------------------------------------------------------

let checked = 0;
const failures = [];

for (const file of scanFiles) {
	const content = readFileSync(file, "utf8");
	const relFile = relative(rootDir, file);

	for (const { url, line } of extractTargets(file, content)) {
		if (skipRe.test(url)) continue;

		const target = resolveInternal(url, file);
		if (!target) continue;

		checked++;
		if (!fileExists(target)) {
			failures.push({ relFile, line, url, target: relative(rootDir, target) });
		}
	}
}

// --- Report --------------------------------------------------------------------

if (failures.length === 0) {
	console.log(`check-links: OK (${checked} internal links checked across ${scanFiles.length} files)`);
	process.exit(0);
}

console.error(`check-links: ${failures.length} broken link(s) found:\n`);
for (const f of failures) {
	console.error(`  ${f.relFile}:${f.line}  ${f.url}  ->  no file at ${f.target}`);
}
process.exit(1);
