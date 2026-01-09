/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#18FF19',
        muted: '#666',
      },
      fontFamily: {
        gothic: ['Central Gothic', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
