/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tailwind CSS 클래스를 스캔할 파일 경로 목록. 일반적인 Next.js 구성을 포함합니다.
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // -----------------------------------------------------
      // 💡 [추가] 커스텀 애니메이션 키프레임 및 적용 시간 설정
      // -----------------------------------------------------
      animation: {
        // 배경 이동 애니메이션: 30초 동안 선형(linear)으로 무한 반복
        'bg-move': 'move-background 30s linear infinite',
        // 별 반짝임 애니메이션: 2초 동안 부드럽게(ease-in-out) 무한 왕복(alternate)
        'twinkle-star': 'twinkle 2s ease-in-out infinite alternate',
      },
      keyframes: {
        // 'move-background' 키프레임 정의
        'move-background': {
          'from': { 'background-position': '0 0' },
          'to': { 'background-position': '100% 100%' },
        },
        // 'twinkle' 키프레임 정의 (0.05에서 1까지의 극적인 투명도 변화)
        'twinkle': {
          '0%, 100%': { opacity: '0.05' },
          '50%': { opacity: '1' },
        },
      },
      // -----------------------------------------------------
    },
  },
  plugins: [],
}