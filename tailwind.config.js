/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // 토스 컬러 팔레트 (대략적인 참조용 - 토스 공식 사양 아님)
        toss: {
          blue: "#3182F6",
          "blue-hover": "#1B64DA",
          "blue-light": "#E8F2FF",
          bg: "#F9FAFB",
          card: "#FFFFFF",
          text: {
            primary: "#191F28",
            secondary: "#4E5968",
            tertiary: "#8B95A1",
            disabled: "#B0B8C1",
          },
          border: "#E5E8EB",
          divider: "#F2F4F6",
          green: "#0EBD8C",
          red: "#F04452",
          yellow: "#FFA800",
        },
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "'Helvetica Neue'",
          "'Segoe UI'",
          "sans-serif",
        ],
      },
      borderRadius: {
        toss: "14px",
        "toss-lg": "20px",
      },
      boxShadow: {
        toss: "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)",
      },
    },
  },
  plugins: [],
};
