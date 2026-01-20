/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#FFFBF5", // Creamy White
        foreground: "#4A403A", // Warm Dark Brown
        
        primary: {
          DEFAULT: "#F4A261", // Warm Orange/Peach
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#E9C46A", // Soft Yellow
          foreground: "#4A403A",
        },
        muted: {
          DEFAULT: "#F3EFEA", // Light Beige
          foreground: "#8D8179",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#4A403A",
        },
        accent: {
          blue: "#A8DADC", // Sleep
          green: "#A7C957", // Diaper
          pink: "#F28482", // Warmth
        },
        // Legacy support (optional, can be phased out)
        baby: {
          pink: "#FFB6C1",
          blue: "#87CEEB",
          mint: "#98FB98",
          lavender: "#E6E6FA",
          peach: "#FFDAB9",
        },
      },
      borderRadius: {
        'xl': '1.5rem',
      },
      spacing: {
        "touch": "48px",
      },
    },
  },
  plugins: [],
};
