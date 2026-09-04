import posthtml from "posthtml";

/**
 * Clickable pull quotes (footnote-style jump links).
 *
 * A `blockquote.pull-quote` is usually a passage from the post set off as a
 * highlight (often placed up front). This transform makes the quote behave
 * like a footnote pair:
 *
 *   - the quote text becomes a link that jumps to the original passage in the
 *     post body,
 *   - a small "↩" backlink is appended to that passage, jumping back to the
 *     quote (same backlink pattern as eleventy-plugin-footnotes).
 *
 * The passage is found automatically by matching the quote's text against the
 * text of every `<p>` on the page (case- and whitespace-insensitive; the quote
 * may be an excerpt of a longer passage). For quotes that reword the passage,
 * point the quote at a specific element instead:
 *
 *     <blockquote class="pull-quote" data-target="#my-paragraph">…</blockquote>
 *
 * A quote opts out with the `data-no-link` attribute:
 *
 *     <blockquote class="pull-quote" data-no-link>…</blockquote>
 */
export default function (eleventyConfig) {
	eleventyConfig.addTransform("pull-quote-links", async function pullQuoteLinks(html) {
		const { inputPath, outputPath } = this;
		// Only run on rendered HTML pages (not feeds, sitemaps, etc.)
		const extension = (outputPath || "").split(".").pop();
		if (extension !== "html") return html;
		// Cheap pre-filter: most pages have no pull quotes
		if (!html.includes('class="pull-quote"')) return html;

		const template = await posthtml().process(html);
		const tree = template.tree;

		// --- Collect the pull quotes and candidate passages ------------------
		const pullQuotes = [];
		const paragraphs = [];
		const ids = new Set();

		(function walk(nodes, insidePullQuote = false) {
			for (const node of nodes) {
				if (typeof node === "string") continue;
				const isQuote = node.tag === "blockquote" && hasClass(node, "pull-quote");
				if (node.attrs?.id) ids.add(node.attrs.id);
				if (isQuote) pullQuotes.push(node);
				// The quote's own <p> children can't be their own passage
				if (node.tag === "p" && !insidePullQuote) paragraphs.push(node);
				if (node.content) walk(node.content, insidePullQuote || isQuote);
			}
		})(tree);

		if (pullQuotes.length === 0) return html;

		// --- Rewrite each pull quote ------------------------------------------
		let quoteCount = 0;
		for (const quote of pullQuotes) {
			if (quote.attrs && "data-no-link" in quote.attrs) continue;
			quoteCount++;

			const quoteText = normalizeText(textOf(quote));
			const source = quote.attrs?.["data-target"]
				? findById(tree, String(quote.attrs["data-target"]).replace(/^#/, ""))
				: findSource(quoteText, paragraphs);
			if (!source) {
				console.warn(
					`[pull-quote-links] No matching passage found for a pull quote in ${inputPath}; quote left as plain text.`
				);
				continue;
			}

			const quoteId = quote.attrs?.id || nextId("pull-quote", ids);
			const sourceId = source.attrs?.id || nextId(`${quoteId}-source`, ids);
			quote.attrs ??= {};
			quote.attrs.id = quoteId;
			source.attrs ??= {};
			source.attrs.id = sourceId;
			addClass(source, "pull-quote-source");

			// Backlink: passage -> quote (mirrors the footnotes' ↩ backlink)
			if (!childWithClass(source, "a", "pull-quote-back")) {
				source.content ??= [];
				source.content.push(" ", backlinkNode(quoteId, quoteCount));
			}

			// Forward link: quote -> passage. Wrap each top-level <p>'s content
			// in the anchor (phrasing content only, so the nesting stays valid).
			// Paragraphs that already contain a link are left alone — wrapping
			// them would nest <a> elements.
			const newContent = [];
			let linked = 0;
			for (const child of quote.content ?? []) {
				if (child.tag === "p" && !containsTag(child, "a")) {
					child.content = [linkNode(sourceId, child.content ?? [])];
					linked++;
				}
				newContent.push(child);
			}
			quote.content = newContent;
			if (linked === 0) {
				console.warn(
					`[pull-quote-links] Could not add a link to the pull quote in ${inputPath} (no wrappable <p> content).`
				);
			}
		}

		return template.html;
	});
}

// --- Helpers ------------------------------------------------------------------

function hasClass(node, cls) {
	return (
		typeof node.attrs?.class === "string" &&
		node.attrs.class.split(/\s+/).includes(cls)
	);
}

function addClass(node, cls) {
	node.attrs.class = node.attrs.class ? `${node.attrs.class} ${cls}` : cls;
}

function childWithClass(node, tag, cls) {
	return (node.content || []).find(
		(child) => typeof child !== "string" && child.tag === tag && hasClass(child, cls)
	);
}

function containsTag(node, tag) {
	for (const child of node.content || []) {
		if (typeof child === "string") continue;
		if (child.tag === tag || containsTag(child, tag)) return true;
	}
	return false;
}

function textOf(node) {
	let out = "";
	for (const child of node.content || []) {
		out += typeof child === "string" ? child : textOf(child);
	}
	return out;
}

// Collapse whitespace + lowercase for a stable text comparison
function normalizeText(text) {
	return text.replace(/\s+/g, " ").trim().toLowerCase();
}

function nextId(base, taken) {
	let id = base;
	let n = 2;
	while (taken.has(id)) id = `${base}-${n++}`;
	taken.add(id);
	return id;
}

function findById(nodes, id) {
	for (const node of nodes) {
		if (typeof node === "string") continue;
		if (node.attrs?.id === id) return node;
		if (node.content) {
			const found = findById(node.content, id);
			if (found) return found;
		}
	}
	return null;
}

function findSource(quoteText, candidates) {
	if (!quoteText) return null;
	// Exact match (quotes usually repeat the passage verbatim)
	let hit = candidates.find((p) => normalizeText(textOf(p)) === quoteText);
	if (hit) return hit;
	// Excerpted quote: a longer passage that contains the full quote text.
	// Require a minimum length so a very short quote can't match anything.
	// Compare with leading/trailing punctuation stripped, since an excerpt
	// often ends mid-sentence in the original passage.
	const core = quoteText.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
	if (core.length >= 40) {
		hit = candidates.find((p) => {
			const text = normalizeText(textOf(p));
			return text.length > core.length && text.includes(core);
		});
	}
	return hit || null;
}

function linkNode(hrefTarget, content) {
	return { tag: "a", attrs: { href: `#${hrefTarget}` }, content };
}

function backlinkNode(quoteId, index) {
	return {
		tag: "a",
		attrs: {
			href: `#${quoteId}`,
			class: "pull-quote-back",
			"aria-label": index > 1 ? `Back to pull quote ${index}` : "Back to pull quote",
			role: "doc-backlink",
		},
		content: ["↩"],
	};
}
