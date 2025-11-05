/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}', // src 디렉토리가 아닌 경우
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}', // src 디렉토리가 있는 경우를 대비해 추가
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}