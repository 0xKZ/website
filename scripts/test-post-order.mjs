#!/usr/bin/env node
/**
 * Post ordering test.
 *
 *   npm test
 *
 * The site relies on a few explicit sorting contracts:
 *   - feed.xml: the feed plugin reverses its collection and only then applies
 *     its limit, so the feed must contain exactly the NEWEST 10 posts,
 *     newest first
 *   - homepage / archive / tag pages: postslist.njk lists posts newest first
 *     (the homepage shows only the newest 3)
 *   - prev/next nav: driven by the ascending `posts` tag collection
 *     (collections.posts) and Eleventy's getPrevious/NextCollectionItem
 *     filters (prev = older post, next = newer post)
 *   - drafts are excluded from production builds, so they must not appear
 *     anywhere in the output
 *
 * With only the real posts (fewer than the feed's limit of 10) a wrong
 * ordering — e.g. a dependency upgrade that changes how the feed plugin or
 * Eleventy orders collections — could ship unnoticed. So this test copies
 * content/ into a throwaway dir in the OS temp dir (linking the repo's
 * _includes/ and _data/ next to it), strips the images
 * (irrelevant to the ordering contracts, and it skips the image pipeline),
 * adds fixture posts with known dates to the copy, builds the site from the
 * copy into a throwaway output dir, asserts the ordering in the output, then
 * removes the throwaway dir. The repository is never touched, so no fixture
 * can ever leak into a real build or a publish.
 *
 * The fixtures bracket the timeline: 10 are dated in 2099 (newer than any
 * real post) and 2 in 1970 (older than any real post), so the expected order
 * of the fixture zones is known without reading any real post — the feed
 * must be exactly the 10 newest fixtures, the homepage exactly the 3
 * newest, and the archive must start with them and end with the 1970 ones.
 * The real posts in between are never modeled: their dates are read from the
 * rendered output and only have to be newest-first (same-day posts may tie).
 * The only thing read from the repo is how many real posts ship (template
 * files in content/blog minus plain `draft: true` posts), so the archive's
 * exact count can be checked and a real post silently dropping from it would
 * be caught.
 *
 * Safety:
 *   - the test never writes into the repository — fixtures only ever exist
 *     inside the throwaway copy
 *   - the throwaway dir is unique per run (mkdtemp), so concurrent runs
 *     can't collide
 *   - an interrupted or hard-killed run (Ctrl-C, kill -9, power loss) leaves
 *     at most the throwaway temp dir, which the OS reclaims — there is
 *     nothing in the repo to clean up
 */

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const FEED_LIMIT = 10; // must match the feed plugin's collection.limit in eleventy.config.js
const LATEST_POSTS_ON_HOME = 3; // must match numberOfLatestPostsToShow in content/index.njk
const TEST_TAG = "order-test-tag";
const FIXTURE_PREFIX = "zz-order-test-";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const contentDir = join(rootDir, "content");
const blogDir = join(contentDir, "blog");

// Throwaway dirs, created per run in the OS temp dir (see the header): a
// copy of content/ the fixtures are added to (the build's input), the
// build's output dir, and their common parent. The repo itself is never
// touched. Assigned in main() after the throwaway dirs are created.
let testRootDir;
let testContentDir;
let testSiteDir;

const failures = [];
const fail = (where, message) => failures.push(`  ${where}  ${message}`);

// --- Fixtures ----------------------------------------------------------------------
//
// Written into the throwaway content copy. Explicit permalinks give known
// URLs; the dates bracket any real post (2099/1970), so the fixture zones
// of every list are pinned without reading a real post.

const pad2 = (n) => String(n).padStart(2, "0");
const fx = (slug, date, tags = [], draft = false) => ({
	slug: `${FIXTURE_PREFIX}${slug}`,
	title: `Order Test ${slug}`,
	date,
	tags,
	draft,
	url: `/blog/${FIXTURE_PREFIX}${slug}/`,
});

// Newest first: the feed must be exactly these 10, the homepage the first 3.
const NEWEST_FIXTURES = Array.from({ length: 10 }, (_, i) =>
	fx(`newest-${pad2(i + 1)}`, `2099-01-${pad2(10 - i)}`)
);
// Three of them (interleaved, not consecutive, so the tag page is a true
// subset of the list rather than a slice of it) carry the test tag.
NEWEST_FIXTURES[1].tags = [TEST_TAG];
NEWEST_FIXTURES[3].tags = [TEST_TAG];
NEWEST_FIXTURES[5].tags = [TEST_TAG];

// The archive's last two items, newest first (1970 dates: older than any
// real post). The oldest fixture's prev/next nav is checked against the
// other one.
const OLDEST_FIXTURES = [
	fx("oldest-02", "1970-01-02"),
	fx("oldest-01", "1970-01-01"),
];

// Drafts, dated in the middle of the timeline: if draft exclusion
// regresses, they'd land in the archive's middle zone — the slug checks
// catch them in the feed, sitemap, and archive.
const DRAFT_FIXTURES = [
	fx("draft-1", "2000-01-01", [], true),
	fx("draft-2", "2000-01-02", [], true),
];

const TAGGED_FIXTURES = NEWEST_FIXTURES.filter((f) => f.tags.includes(TEST_TAG));
const NON_DRAFT_FIXTURES = [...NEWEST_FIXTURES, ...OLDEST_FIXTURES];
const ALL_FIXTURES = [...NON_DRAFT_FIXTURES, ...DRAFT_FIXTURES];

function writeFixtures() {
	for (const f of ALL_FIXTURES) {
		const lines = [
			"---",
			`title: ${f.title}`,
			"description: Fixture post for the post ordering test (scripts/test-post-order.mjs).",
			`date: ${f.date}`,
			`permalink: ${f.url}`,
		];
		if (f.tags.length) lines.push(`tags: ${f.tags.join(", ")}`);
		if (f.draft) lines.push("draft: true");
		lines.push("---", "", "Temporary fixture post created by `npm test`. Removed after the test run.");
		writeFileSync(join(testContentDir, "blog", `${f.slug}.md`), lines.join("\n"));
	}
}

// --- Real posts ------------------------------------------------------------------
//
// Real posts are never modeled (their dates are read from the rendered
// output); the only thing taken from the repo is how many of them ship in a
// production build, so the archive's exact count can be checked. Two
// simplifications, each loud-failing (archive count mismatch) if broken:
//   - a "post" is any content/blog file in one of Eleventy's template
//     formats (non-template files don't build as pages)
//   - a draft is a post whose front matter has a plain truthy `draft:`
//     line (drafts are excluded from production builds, see
//     eleventy.config.js). Quoted or exotic spellings aren't detected.

const TEMPLATE_EXTS = [".md", ".njk", ".html", ".liquid", ".11ty.js"]; // must match templateFormats in eleventy.config.js
const DRAFT_LINE_RE = /^draft:\s*(true|yes|on|1)\s*(?:#.*)?$/im;

function shippingPostCount() {
	let count = 0;
	for (const file of walkFiles(blogDir)) {
		const name = file.slice(file.lastIndexOf(sep) + 1);
		if (name.endsWith(".11tydata.js") || !TEMPLATE_EXTS.some((e) => name.endsWith(e))) continue;
		const fm = readFileSync(file, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/);
		if (fm && DRAFT_LINE_RE.test(fm[1])) continue; // draft: excluded from production builds
		count++;
	}
	return count;
}

// --- Build ---------------------------------------------------------------------

/**
 * Symlink a repo directory into the throwaway dir. The Eleventy config
 * points at _includes/ and _data/ with input-relative ../ paths, so those
 * dirs must sit next to the throwaway input dir; symlinking keeps them out
 * of the copy entirely. The repo's node_modules deliberately needs no link:
 * Node resolves imports in _includes/ and _data/ from their real path (the
 * repo), where node_modules already sits. Fails loudly if the symlink can't
 * be made — a copy fallback would mask a broken platform (and copying
 * node_modules would be enormous).
 */
function linkIntoTemp(src, dest) {
	symlinkSync(src, dest, process.platform === "win32" ? "junction" : "dir");
}

/**
 * Build the site from the throwaway content copy into the throwaway output
 * dir (see the header). Spawned synchronously on purpose: the child stays
 * in the test's process group, so a Ctrl-C from the terminal signals the
 * whole group and the build dies with the test — no signal handlers or
 * process-group plumbing needed, and a mid-run death leaves at most the
 * throwaway temp dir (the OS reclaims it).
 */
function build() {
	const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
	// Relative input path, on purpose: with an absolute --input, Eleventy
	// (3.1.x) computes template paths relative to the project root but keeps
	// the input dir absolute, so its folder-data lookup
	// (getLocalDataPaths' dir.startsWith(inputDir) check) matches nothing and
	// silently skips every .11tydata.js file — the "posts" tag would be
	// missing from every post.
	const input = relative(rootDir, testContentDir).split(sep).join("/");
	const result = spawnSync(
		npxCmd,
		["@11ty/eleventy", `--input=${input}`, `--output=${testSiteDir}`],
		{
			cwd: rootDir,
			env: { ...process.env, NODE_DISABLE_COLORS: "1" },
			encoding: "utf8",
			maxBuffer: 10 * 1024 * 1024,
		}
	);
	if (result.error) {
		throw new Error(`could not start build: ${result.error.message}`);
	}
	if (result.status !== 0) {
		const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
		throw new Error(`build failed (exit ${result.status ?? "unknown"}):\n${output.slice(-4000)}`);
	}
}

// Image file extensions (used by stripImages below).
const ASSET_RE = /\.(png|jpe?g|gif|webp|svg|avif)$/i;

/**
 * Remove image files from the throwaway content copy. The ordering
 * contracts never involve images, and this skips the image transform
 * pipeline (eleventy-img / sharp) on every test run — the copy is
 * throwaway, and the transform runs with failOnError: false, so missing
 * files are simply not transformed.
 */
function stripImages(dir) {
	for (const full of walkFiles(dir)) {
		if (ASSET_RE.test(full)) rmSync(full);
	}
}

function walkFiles(dir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) walkFiles(full, out);
		else out.push(full);
	}
	return out;
}

// --- Output parsing -----------------------------------------------------------------

const xmlDecode = (s) =>
	s
		.replace(/&#39;/g, "'")
		.replace(/&quot;/g, '"')
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&");

function feedEntries(feedXml) {
	return [...feedXml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => {
		const block = m[1];
		return {
			title: xmlDecode(block.match(/<title>([\s\S]*?)<\/title>/)[1]),
			updated: block.match(/<updated>([^<]*)<\/updated>/)[1],
			link: block.match(/<link href="([^"]+)"/)[1],
		};
	});
}

/**
 * Parse the post list on a page: the first <ol> whose class list contains
 * "postlist", and each item's link href and <time datetime>. Within each
 * <li>, the link and date are matched positionally (first <a href> + first
 * <time>) rather than by class name, so markup changes below the matched
 * elements don't break the test. Renaming the "postlist" class or the <li>
 * structure itself is not tolerated on purpose — that should fail loudly so
 * this test gets updated.
 */
function parsePostlist(html) {
	for (const ol of html.matchAll(/<ol\b([^>]*)>([\s\S]*?)<\/ol>/g)) {
		const classAttr = ol[1].match(/\bclass="([^"]*)"/);
		if (!classAttr || !classAttr[1].split(/\s+/).includes("postlist")) continue;
		const items = [...ol[2].matchAll(/<li\b[^>]*>[\s\S]*?<\/li>/g)].map((li) => {
			const href = li[0].match(/<a\b[^>]*href="([^"]+)"/);
			const datetime = li[0].match(/<time\b[^>]*datetime="([^"]+)"/);
			return { url: href ? href[1] : null, date: datetime ? datetime[1] : null };
		});
		return { items };
	}
	return null;
}

function navHref(html, direction) {
	// Bound the match to the nav <li> itself (the lazy group stops at its
	// closing tag), so an anchor anywhere else on the page can never match —
	// even if the markup around the nav changes.
	const li = html.match(
		new RegExp(`<li\\b[^>]*class="[^"]*links-nextprev-${direction}(?:\\s|")[\\s\\S]*?</li>`)
	);
	const a = li && li[0].match(/<a\b[^>]*href="([^"]+)"/);
	return a ? a[1] : null;
}

// --- Assertions ------------------------------------------------------------------------

/**
 * A list is newest-first when no item is newer than the one before it.
 * Same-day posts may tie (the site's contract is "no older post before a
 * newer one", not "distinct dates"), so the comparison is non-strict.
 */
function checkNewestFirst(where, items) {
	for (let i = 1; i < items.length; i++) {
		if (!items[i].date) {
			fail(where, `item ${i + 1} has no <time datetime>`);
			return;
		}
		if (items[i].date > items[i - 1].date) {
			fail(where, `item ${i + 1} (${items[i].date}) is newer than item ${i} (${items[i - 1].date}) — posts must be newest first`);
			return;
		}
	}
}

/**
 * Assert the pinned fixture items (known dates AND known URLs) at a fixed
 * position in a list.
 */
function checkZone(where, items, expected, offset) {
	for (let i = 0; i < expected.length; i++) {
		const item = items[offset + i];
		const f = expected[i];
		if (!item) {
			fail(where, `item ${offset + i + 1}: expected "${f.title}" (${f.date}), got nothing — the list is shorter than expected`);
			return;
		}
		if (item.date !== f.date) {
			fail(where, `item ${offset + i + 1}: expected "${f.title}" (${f.date}), got ${item.date} at ${item.url ?? "no link"}`);
			continue;
		}
		if (item.url !== f.url) {
			fail(where, `item ${offset + i + 1}: "${f.title}" links to ${item.url}, expected ${f.url}`);
		}
	}
}

function assertFeed(feedXml, draftLeaks) {
	const where = "site/feed/feed.xml";
	const entries = feedEntries(feedXml);
	if (entries.length !== FEED_LIMIT) {
		fail(where, `expected ${FEED_LIMIT} <entry> elements (the feed keeps only the newest ${FEED_LIMIT}), got ${entries.length}`);
	}
	NEWEST_FIXTURES.forEach((f, i) => {
		const e = entries[i];
		if (!e || e.updated.slice(0, 10) !== f.date) {
			fail(where, `entry ${i + 1}: expected "${f.title}" (${f.date}), got ${e ? `"${e.title}" (${e.updated})` : "nothing"}`);
			return;
		}
		// The feed plugin prefixes the post URL with the feed's base URL
		// (metadata.url), so only the suffix is asserted — it must point at
		// this post.
		if (!e.link.endsWith(f.url)) {
			fail(where, `entry ${i + 1}: "${f.title}" links to ${e.link}, expected a link ending in ${f.url}`);
		}
	});
	// The feed-level <updated> is the first one in the document (before entries).
	const feedUpdated = feedXml.match(/<updated>([^<]*)<\/updated>/);
	if (!feedUpdated || feedUpdated[1].slice(0, 10) !== NEWEST_FIXTURES[0].date) {
		fail(where, `feed <updated> should be the newest post date (${NEWEST_FIXTURES[0].date}), got ${feedUpdated ? feedUpdated[1] : "nothing"}`);
	}
	for (const d of draftLeaks) {
		if (feedXml.includes(d.marker)) fail(where, `${d.label} leaked into the feed`);
	}
}

// --- Main --------------------------------------------------------------------------------

function main() {
	// The only thing read from the repo: how many real posts ship (see
	// shippingPostCount) — everything else is asserted from the output.
	const realPostCount = shippingPostCount();

	// Create the throwaway dirs (unique per run; removed in the finally
	// block below).
	testRootDir = mkdtempSync(join(tmpdir(), "eleventy-post-order-test-"));
	testContentDir = join(testRootDir, "content");
	testSiteDir = join(testRootDir, "site");

	let assertionError = null;
	let buildError = null;
	try {
		// Copy content/ into the throwaway input dir (stripping the images,
		// see stripImages), symlink the repo's _includes/ and _data/ next to
		// it (see linkIntoTemp), then add the fixtures to the copy — the
		// repo is never modified.
		cpSync(contentDir, testContentDir, { recursive: true });
		stripImages(testContentDir);
		linkIntoTemp(join(rootDir, "_includes"), join(testRootDir, "_includes"));
		linkIntoTemp(join(rootDir, "_data"), join(testRootDir, "_data"));
		writeFixtures();
		build();
		try {
			runAssertions(realPostCount);
		} catch (err) {
			// A thrown assertion (e.g. the build output moved or the markup
			// changed) is recorded instead of propagated so the summary below
			// can report it; the finally block removes the throwaway dir
			// regardless.
			assertionError = err;
		}
	} catch (err) {
		// Copying, writing the fixtures, or the fixture build itself failed
		// (reported below); the finally block removes the throwaway dir a
		// failed build may have partially written.
		buildError = err;
	} finally {
		rmSync(testRootDir, { recursive: true, force: true });
	}

	if (buildError) {
		console.error(`error: ${buildError.message}\n`);
	}
	if (assertionError) {
		// A thrown assertion usually means the test's own parsing broke —
		// surface the stack so it's diagnosable.
		console.error(`test-post-order: assertion threw:\n${assertionError.stack}\n`);
	}
	if (failures.length) {
		console.error(`test-post-order: ${failures.length} problem(s) found:\n`);
		for (const f of failures) console.error(f);
	}
	if (buildError || assertionError || failures.length) process.exit(1);
	console.log(
		`test-post-order: OK (${realPostCount} real posts + ${ALL_FIXTURES.length} fixtures; feed newest-first with limit ${FEED_LIMIT}; home/archive/tag lists, prev/next nav, and tag index all ordered correctly)`
	);
}

function runAssertions(realPostCount) {
	const draftLeaks = DRAFT_FIXTURES.map((f) => ({ marker: f.slug, label: `draft fixture "${f.slug}"` }));

	// Feed: exactly the 10 newest fixtures, newest first, nothing else.
	assertFeed(readFileSync(join(testSiteDir, "feed", "feed.xml"), "utf8"), draftLeaks);

	// Homepage: exactly the newest 3, newest first (all fixtures).
	const home = parsePostlist(readFileSync(join(testSiteDir, "index.html"), "utf8"));
	if (!home) {
		fail("site/index.html", "no <ol> with a postlist class found");
	} else {
		if (home.items.length !== LATEST_POSTS_ON_HOME) {
			fail("site/index.html", `expected ${LATEST_POSTS_ON_HOME} items, got ${home.items.length}`);
		}
		checkZone("site/index.html", home.items, NEWEST_FIXTURES.slice(0, LATEST_POSTS_ON_HOME), 0);
	}

	// Archive: every shipping post exactly once, newest first. The fixture
	// zones pin the head and tail; the real posts in between only have to be
	// newest-first by rendered date (see checkNewestFirst).
	const archiveHtml = readFileSync(join(testSiteDir, "blog", "index.html"), "utf8");
	const archive = parsePostlist(archiveHtml);
	if (!archive) {
		fail("site/blog/index.html", "no <ol> with a postlist class found");
	} else {
		const expectedCount = NON_DRAFT_FIXTURES.length + realPostCount;
		if (archive.items.length !== expectedCount) {
			fail("site/blog/index.html", `expected ${expectedCount} items (${NON_DRAFT_FIXTURES.length} non-draft fixtures + ${realPostCount} real posts), got ${archive.items.length} — check the test's real-post model in shippingPostCount() (scripts/test-post-order.mjs)`);
		}
		checkNewestFirst("site/blog/index.html", archive.items);
		checkZone("site/blog/index.html", archive.items, NEWEST_FIXTURES, 0);
		checkZone("site/blog/index.html", archive.items, OLDEST_FIXTURES, archive.items.length - OLDEST_FIXTURES.length);
	}

	// Tag page for the test tag: exactly the tagged fixtures, newest first.
	const tagPagePath = join(testSiteDir, "tags", TEST_TAG, "index.html");
	if (!existsSync(tagPagePath)) {
		fail(`site/tags/${TEST_TAG}/`, "tag page not generated");
	} else {
		const list = parsePostlist(readFileSync(tagPagePath, "utf8"));
		if (!list) {
			fail(`site/tags/${TEST_TAG}/index.html`, "no <ol> with a postlist class found");
		} else {
			if (list.items.length !== TAGGED_FIXTURES.length) {
				fail(`site/tags/${TEST_TAG}/index.html`, `expected ${TAGGED_FIXTURES.length} items, got ${list.items.length}`);
			}
			checkZone(`site/tags/${TEST_TAG}/index.html`, list.items, TAGGED_FIXTURES, 0);
		}
	}

	// Tag index: the fixture tag appears.
	const tagsIndex = readFileSync(join(testSiteDir, "tags", "index.html"), "utf8");
	if (!tagsIndex.includes(`/tags/${TEST_TAG}/`)) {
		fail("site/tags/index.html", `missing link to /tags/${TEST_TAG}/`);
	}

	// Prev/next nav, checked on the test's own fixture pages (no real
	// post's permalink or layout involved): the newest fixture has no next
	// and its prev is the #2 fixture; the oldest fixture has no prev and
	// its next is the #2 oldest fixture — all URLs known.
	const newest = NEWEST_FIXTURES[0];
	const newestPage = readFileSync(join(testSiteDir, "blog", newest.slug, "index.html"), "utf8");
	const newestWhere = `site/blog/${newest.slug}/`;
	if (navHref(newestPage, "next") !== null) fail(newestWhere, "newest post should have no next");
	if (navHref(newestPage, "prev") !== NEWEST_FIXTURES[1].url) {
		fail(newestWhere, `prev should link to ${NEWEST_FIXTURES[1].url}, got ${navHref(newestPage, "prev") ?? "nothing"}`);
	}

	const oldest = OLDEST_FIXTURES[OLDEST_FIXTURES.length - 1];
	const oldestPage = readFileSync(join(testSiteDir, "blog", oldest.slug, "index.html"), "utf8");
	const oldestWhere = `site/blog/${oldest.slug}/`;
	if (navHref(oldestPage, "prev") !== null) fail(oldestWhere, "oldest post should have no prev");
	if (navHref(oldestPage, "next") !== OLDEST_FIXTURES[0].url) {
		fail(oldestWhere, `next should link to ${OLDEST_FIXTURES[0].url}, got ${navHref(oldestPage, "next") ?? "nothing"}`);
	}

	// Draft fixtures: nowhere in the sitemap or the archive (the feed is
	// covered by assertFeed).
	const leakDocs = [
		["sitemap.xml", readFileSync(join(testSiteDir, "sitemap.xml"), "utf8")],
		["archive", archiveHtml],
	];
	for (const d of draftLeaks)
		for (const [where, doc] of leakDocs)
			if (doc.includes(d.marker)) fail(where, `${d.label} leaked into the build`);
}

try {
	main();
} catch (err) {
	// main() catches the expected failure paths itself; an escape means the
	// test's own code broke — surface the stack so it's diagnosable.
	console.error(`test-post-order: ${err.stack || err.message}`);
	process.exit(1);
}
