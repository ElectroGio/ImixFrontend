/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./app/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                imixLeaf: { 50: "#f1faf3", 500: "#2f9e44", 700: "#1e7a35" },
                imixSun: { 500: "#f6c453" }
            }
        }
    },
    plugins: []
};
