
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./app/**/**/*.{js,jsx,ts,tsx}",
    "./components/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./components/**/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./pages/**/**/*.{js,jsx,ts,tsx}",
    "./pages/**/**/**/*.{js,jsx,ts,tsx}",
    "./pages/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    fontFamily: {
      'serif': ['Manrope'],
    },
    screens: {
      "st": { max: "750px" },
      "mmd": {max: "640px"},
      "md": { max: "427px" },
      "2usm": { max: "505px" },
      "2sm": { max: "975px" },
      usm: { max: "940px" },
    },
    extend: {},
  },
  plugins: [],
};