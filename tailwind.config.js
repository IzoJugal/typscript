import flowbite from "flowbite-react/tailwind";
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/react-tailwindcss-datepicker/dist/index.esm.{js,ts}",
    flowbite.content(),
  ],
  theme: {
    extend: {
      colors: {
        PRIMARY: '#4A4E69',
        PRIMARY_HOVER: '#3E4158',
        SECONDARY: '#212529',
        SECONDARY_HOVER: '#121416',

        BRAND: {
          50: "#F3F3F6",
          100: "#E7E8ED",
          200: "#D3D4E0",
          300: "#B2B3C9",
          400: "#898BA9",
          500: "#4A4E69",
          600: "#3E4158",
          700: "#333648",
          800: "#282A38",
          900: "#1D1F29",
        },

        DARK: {
          50: "#F8F9FA",
          100: "#E9ECEF",
          200: "#DEE2E6",
          300: "#CED4DA",
          400: "#ADB5BD",
          500: "#6C757D",
          600: "#495057",
          700: "#343A40",
          800: "#212529",
          900: "#121416",
          950: "#090A0B",
        },

        // Header gradient
        LIGHT_BLUE: '#898BA9', // Adjusted to match brand
        DARK_BLUE: '#282A38',  // Adjusted to match brand

        TABLE_HEADER: '#E7E8ED',   // BRAND.100
        TABLE_HEADER_BORDER: '#D3D4E0', // BRAND.200
        NAVBAR_BG: '#282A38',     // BRAND.800
        SIDEBAR_BG: '#F3F3F6',    // BRAND.50
        SIDEBAR_ITEM_HOVER: '#E7E8ED', // BRAND.100
        TERTIARY: '#333648',      // BRAND.700
        TERTIARY_HOVER: '#282A38', // BRAND.800

        ACCENT: "#1D9BF0", // Bright Blue (can stay as generic accent)
        ACCENT_HOVER: "#006DB3",
        SUCCESS: "#28A745",
        SUCCESS_HOVER: "#218838",

        ERROR: "#F15A54",
        ERROR_HOVER: "#E12A2A",
        ERROR_ACTIVE: "#C81E1E",

        WARNING: "#FFC107",
        WARNING_HOVER: "#E0A800",
        INFO: "#17A2B8",
        INFO_HOVER: "#117A8B",

        LIGHT_GRAY: "#F8F9FA",
        MEDIUM_GRAY: "#6C757D",
        DARK_GRAY: "#343A40",

        WHITE: "#FFFFFF",
        BLACK: "#000000",
      },
      screens: {
        xs: '576px',
        lmd: '992px',
        mdl: '1140px',
      },
      borderColor: {
        DEFAULT: "#D3D4E0", // BRAND.200
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
    },
    // extend: {
    //   colors: {
    //     // Primary & secondary
    //     PRIMARY: '#027DFB',          // Main blue
    //     PRIMARY_HOVER: '#0263C7',    // Darker blue for hover
    //     SECONDARY: '#0F172A',        // Dark navy for sidebar/nav
    //     SECONDARY_HOVER: '#020617',

    //     // Brand gradient (blue scale)
    //     BRAND: {
    //       50: "#E6F2FF",
    //       100: "#CCE4FF",
    //       200: "#99C9FF",
    //       300: "#66ADFF",
    //       400: "#3392FF",
    //       500: "#027DFB", // PRIMARY
    //       600: "#0263C7", // PRIMARY_HOVER
    //       700: "#014A94",
    //       800: "#013261",
    //       900: "#001A2E",
    //     },

    //     // Dark colors (unchanged)
    //     DARK: {
    //       50: "#F9FAFB",
    //       100: "#F9FAFB",
    //       200: "#E5E7EB",
    //       300: "#D1D5DB",
    //       400: "#9CA3AF",
    //       500: "#6B7280",
    //       600: "#4B5563",
    //       700: "#374151",
    //       800: "#1F2937",
    //       900: "#111827",
    //       950: "#030712",
    //     },

    //     // Backgrounds & UI
    //     NAVBAR_BG: '#FFFFFF',          // Clean white navbar
    //     SIDEBAR_BG: '#0F172A',         // Dark sidebar
    //     SIDEBAR_ITEM_HOVER: '#1E293B', // Subtle hover
    //     TABLE_HEADER: '#E6F2FF',       // Light blue header
    //     TABLE_HEADER_BORDER: '#99C9FF',

    //     // Accent & actions
    //     TERTIARY: '#F59E0B',           // Orange for alerts/actions
    //     TERTIARY_HOVER: '#D97706',
    //     ACCENT: '#38BDF8',             // Light blue accent
    //     ACCENT_HOVER: '#0EA5E9',

    //     // Status colors
    //     SUCCESS: "#22C55E",
    //     SUCCESS_HOVER: "#16A34A",
    //     ERROR: "#EF4444",
    //     ERROR_HOVER: "#DC2626",
    //     ERROR_ACTIVE: "#B91C1C",
    //     WARNING: "#FACC15",
    //     WARNING_HOVER: "#EAB308",
    //     INFO: "#027DFB",               // Matches primary
    //     INFO_HOVER: "#0263C7",

    //     // Neutrals
    //     LIGHT_GRAY: "#F8FAFC",
    //     MEDIUM_GRAY: "#64748B",
    //     DARK_GRAY: "#334155",
    //     WHITE: "#FFFFFF",
    //     BLACK: "#000000",
    //   },

    //   screens: {
    //     xs: '576px',
    //     lmd: '992px',
    //     mdl: '1140px',
    //   },

    //   borderColor: {
    //     DEFAULT: "#E5E7EB",
    //   },
    // }
  },
  plugins: [
    require('tailwind-scrollbar'),
    flowbite.plugin(),
  ],
}

