/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      spacing: {
        1: "var(--spacing-1)",
        2: "var(--spacing-2)",
        4: "var(--spacing-4)",
        8: "var(--spacing-8)",
      },
      fontSize: {
        sm: "var(--font-size-sm)",
        md: "var(--font-size-md)",
        lg: "var(--font-size-lg)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
      },
      colors: {
        bg: "var(--color-bg)",
        fg: "var(--color-fg)",
        muted: "var(--color-muted)",
      },
    },
  },
  plugins: [],
};
