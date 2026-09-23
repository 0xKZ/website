// Thank you to https://github.com/daviddarnes/heading-anchors
// Thank you to https://amberwilson.co.uk/blog/are-your-anchor-links-accessible/

let globalInstanceIndex = 0;

class HeadingAnchors extends HTMLElement {
	static register(tagName = "heading-anchors", registry = window.customElements) {
		if(registry && !registry.get(tagName)) {
			registry.define(tagName, this);
		}
	}

	static attributes = {
		exclude: "data-ha-exclude",
		prefix: "prefix",
		content: "content",
	}

	static classes = {
		anchor: "ha",
		placeholder: "ha-placeholder",
		srOnly: "ha-visualhide",
	}

	static defaultSelector = "h2,h3,h4,h5,h6";

	static css = `
.${HeadingAnchors.classes.srOnly} {
	clip: rect(0 0 0 0);
	height: 1px;
	overflow: hidden;
	position: absolute;
	width: 1px;
}
.${HeadingAnchors.classes.anchor} {
	position: absolute;
	left: var(--ha_offsetx);
	top: var(--ha_offsety);
	text-decoration: none;
	opacity: 0;
}
.${HeadingAnchors.classes.placeholder} {
	opacity: .3;
}
.${HeadingAnchors.classes.anchor}:is(:focus-within, :hover) {
	opacity: 1;
}
.${HeadingAnchors.classes.anchor},
.${HeadingAnchors.classes.placeholder} {
	display: inline-block;
	padding: 0 .25em;

	/* Disable selection of visually hidden label */
	-webkit-user-select: none;
	user-select: none;
}

@supports (anchor-name: none) {
	.${HeadingAnchors.classes.anchor} {
		position: absolute;
		left: anchor(left);
		top: anchor(top);
	}
}`;

	get supports() {
		return "replaceSync" in CSSStyleSheet.prototype;
	}

	get supportsAnchorPosition() {
		return CSS.supports("anchor-name: none");
	}

	constructor() {
		super();

		if(!this.supports) {
			return;
		}

		let sheet = new CSSStyleSheet();
		sheet.replaceSync(HeadingAnchors.css);
		document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];

		this.headingStyles = {};
		this.instanceIndex = globalInstanceIndex++;
	}

	connectedCallback() {
		if (!this.supports) {
			return;
		}

		this.headings.forEach((heading, index) => {
			if(!heading.hasAttribute(HeadingAnchors.attributes.exclude)) {
				let anchor = this.getAnchorElement(heading);
				let placeholder = this.getPlaceholderElement();

				// Prefers anchor position approach for better accessibility
				// https://amberwilson.co.uk/blog/are-your-anchor-links-accessible/
				if(this.supportsAnchorPosition) {
					let anchorName = `--ha_${this.instanceIndex}_${index}`;
					placeholder.style.setProperty("anchor-name", anchorName);
					anchor.style.positionAnchor = anchorName;
				}

				heading.appendChild(placeholder);
				heading.after(anchor);
			}
		});
	}

	// Polyfill-only
	positionAnchorFromPlaceholder(placeholder) {
		if(!placeholder) {
			return;
		}

		let heading = placeholder.closest("h1,h2,h3,h4,h5,h6");
		if(!heading.nextElementSibling) {
			return;
		}

		// TODO next element could be more defensive
		this.positionAnchor(heading.nextElementSibling);
	}

	// Polyfill-only
	positionAnchor(anchor) {
		if(!anchor || !anchor.previousElementSibling) {
			return;
		}

		// TODO previous element could be more defensive
		let heading = anchor.previousElementSibling;
		this.setFontProp(heading, anchor);

		if(this.supportsAnchorPosition) {
			// quit early
			return;
		}

		let placeholder = heading.querySelector(`.${HeadingAnchors.classes.placeholder}`);
		if(placeholder) {
			anchor.style.setProperty("--ha_offsetx", `${placeholder.offsetLeft}px`);
			anchor.style.setProperty("--ha_offsety", `${placeholder.offsetTop}px`);
		}
	}

	setFontProp(heading, anchor) {
		let placeholder = heading.querySelector(`.${HeadingAnchors.classes.placeholder}`);
		if(placeholder) {
			let style = getComputedStyle(placeholder);
			let props = ["font-weight", "font-size", "line-height", "font-family"];
			let [weight, size, lh, family] = props.map(name => style.getPropertyValue(name));
			anchor.style.setProperty("font", `${weight} ${size}/${lh} ${family}`);
			let vars = style.getPropertyValue("font-variation-settings");
			if(vars) {
				anchor.style.setProperty("font-variation-settings", vars);
			}
		}
	}

	getAccessibleTextPrefix() {
		// Useful for i18n
		return this.getAttribute(HeadingAnchors.attributes.prefix) || "Jump to section titled";
	}

	getContent() {
		if(this.hasAttribute(HeadingAnchors.attributes.content)) {
			return this.getAttribute(HeadingAnchors.attributes.content);
		}
		return "#";
	}

	// Placeholder nests inside of heading
	getPlaceholderElement() {
		let ph = document.createElement("span");
		ph.setAttribute("aria-hidden", true);
		ph.classList.add(HeadingAnchors.classes.placeholder);
		let content = this.getContent();
		if(content) {
			ph.textContent = content;
		}

		ph.addEventListener("mouseover", (e) => {
			let placeholder = e.target.closest(`.${HeadingAnchors.classes.placeholder}`);
			if(placeholder) {
				this.positionAnchorFromPlaceholder(placeholder);
			}
		});

		return ph;
	}

	getAnchorElement(heading) {
		let anchor = document.createElement("a");
		anchor.href = `#${heading.id}`;
		anchor.classList.add(HeadingAnchors.classes.anchor);

		let content = this.getContent();
		anchor.innerHTML = `<span class="${HeadingAnchors.classes.srOnly}">${this.getAccessibleTextPrefix()}: ${heading.textContent}</span>${content ? `<span aria-hidden="true">${content}</span>` : ""}`;

		anchor.addEventListener("focus", e => {
			let anchor = e.target.closest(`.${HeadingAnchors.classes.anchor}`);
			if(anchor) {
				this.positionAnchor(anchor);
			}
		});

		anchor.addEventListener("mouseover", (e) => {
			// when CSS anchor positioning is supported, this is only used to set the font
			let anchor = e.target.closest(`.${HeadingAnchors.classes.anchor}`);
			this.positionAnchor(anchor);
		});

		return anchor;
	}

	get headings() {
		return this.querySelectorAll(this.selector.split(",").map(entry => `${entry.trim()}[id]`));
	}

	get selector() {
		return this.getAttribute("selector") || HeadingAnchors.defaultSelector;
	}
}

HeadingAnchors.register();

export { HeadingAnchors }
document.addEventListener("click", (event) => {
				const link = event.target.closest?.(".pull-quote a[href^='#']");
				if (!link) return;
				const id = decodeURIComponent(link.hash.slice(1));
				document.getElementById(id)?.classList.add("pull-quote-visited");
			});
(function () {
				const button = document.querySelector(".theme-toggle");
				if (!button) return;

				const root = document.documentElement;
				const STORAGE_KEY = "zk-theme";
				const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
				const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
				// The system setting; an explicit override (data-theme) wins over it
				const systemTheme = () => (prefersDark.matches ? "dark" : "light");
				const effectiveTheme = () => root.dataset.theme || systemTheme();
				// A value pins the theme; null clears the override (follow the system)
				const setTheme = (theme) => {
					if (theme) root.dataset.theme = theme;
					else delete root.dataset.theme;
					try {
						if (theme) localStorage.setItem(STORAGE_KEY, theme);
						else localStorage.removeItem(STORAGE_KEY);
					} catch {
						/* no localStorage access: the choice just won't persist */
					}
				};

				// No static aria-pressed in the markup: a hardcoded default would
				// misstate the mode until this runs
				const syncPressed = () =>
					button.setAttribute("aria-pressed", String(effectiveTheme() === "dark"));
				syncPressed();

				// If the system setting flips while the page is open, the CSS flips the
				// colors and icon by itself — but only re-sync aria-pressed when the
				// site is actually following the system (an override pins the state)
				prefersDark.addEventListener("change", () => {
					if (!root.dataset.theme) syncPressed();
				});

				button.addEventListener("click", () => {
					const target = effectiveTheme() === "dark" ? "light" : "dark";
					const apply = () => {
						// Toggling back to the current system setting clears the
						// override, so the site keeps following the system instead
						// of staying pinned
						setTheme(target === systemTheme() ? null : target);
						syncPressed();
					};
					// Crossfade the swap with the View Transition API (the same one
					// the site uses for navigation, see css/index.css), except while
					// another transition is in progress (a second startViewTransition()
					// call would throw InvalidStateError; navigation transitions are
					// the common case) and under prefers-reduced-motion (an explicit
					// call isn't guaranteed to be suppressed by the browser, unlike
					// automatic navigation transitions). The callback runs
					// synchronously inside startViewTransition(), so `target` above
					// is always up to date — no bookkeeping needed for fast clicks.
					const canCrossfade = "startViewTransition" in document &&
						!document.viewTransition &&
						!prefersReducedMotion.matches;
					if (canCrossfade) {
						document.startViewTransition(apply);
					} else {
						apply();
					}
				});
			})();