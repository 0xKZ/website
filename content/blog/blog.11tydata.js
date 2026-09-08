// The post ordering test (npm test, runs in CI) reads post dates from the
// build output, but counts real posts from this folder: a "post" is any
// file in an Eleventy template format, and a draft is one whose front
// matter has a plain `draft: true` line. Quoted or other exotic draft
// spellings aren't detected — if a post needs one, extend
// shippingPostCount() in scripts/test-post-order.mjs.
export default {
	tags: [
		"posts"
	],
	"layout": "layouts/post.njk",
};
