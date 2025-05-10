/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",       // Next.js app directory
    "./pages/**/*.{js,ts,jsx,tsx}",     // Optional: for pages/ folder
    "./components/**/*.{js,ts,jsx,tsx}",// Your shared UI components
  ],
  theme: {
    extend: {
      fontWeight: {
        bold: '700', // Explicitly define 'bold' as 700 if needed
      },
    },                         
  },
   plugins: [require("daisyui")],      // DaisyUI plugin included
};
