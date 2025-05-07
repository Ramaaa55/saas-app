

const { default: daisyui } = require('daisyui');
const { plugin } = require('daisyui/functions/plugin');
const { default: themes } = require('daisyui/theme/object');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["retro", "cupcake", "cyberpunk"],
  },
};

