/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",       // Next.js app directory
    "./pages/**/*.{js,ts,jsx,tsx}",     // Optional: for pages/ folder
    "./components/**/*.{js,ts,jsx,tsx}",// Your shared UI components
  ],
  theme: {
    extend: {},                         // Customize your theme here
  },
  plugins: [require("daisyui")],        // DaisyUI plugin included
  daisyui: {
    themes: ["retro", "cupcake", "cyberpunk"], // Your active themes
  },
};
