import stripLab from "./lib/postcss-strip-lab.mjs";

const config = {
  plugins: [
    "@tailwindcss/postcss",
    stripLab(),
  ],
};

export default config;
