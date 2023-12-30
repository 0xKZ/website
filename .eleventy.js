module.exports = function(eleventyConfig) {

    // Folders to copy to output folder
    eleventyConfig.addPassthroughCopy("css");
    eleventyConfig.addPassthroughCopy("CNAME");
    return {
        pathPrefix: "/website/"
    }
};



