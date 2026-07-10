export default function stripLabBlocks() {
  return {
    postcssPlugin: "postcss-strip-lab",
    AtRule(atRule) {
      if (
        atRule.name === "supports" &&
        atRule.params.includes("lab(")
      ) {
        atRule.remove();
      }
    },
  };
}
stripLabBlocks.postcss = true;
