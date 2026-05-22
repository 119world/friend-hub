export default {
  content: {
    relative: true,
    files: ["./index.html", "./src/**/*.{js,jsx}"]
  },
  safelist: ["grid", "fixed", "rounded-full"],
  theme: {
    extend: {
      colors: { blush: "#fff3f7", roseSoft: "#f76f9a", roseDeep: "#c73568", ink: "#2d1f27" },
      boxShadow: { soft: "0 18px 45px rgba(199, 53, 104, 0.12)" }
    }
  },
  plugins: []
};
