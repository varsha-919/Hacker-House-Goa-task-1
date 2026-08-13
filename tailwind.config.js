/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Hacker House Goa 2026 — Event palette
        // Cream is now the primary page background (printed poster paper).
        // Deep green is reserved for typography, borders, and the design
        // accent only — not the page bg.
        ink: {
          DEFAULT: '#0E2A1F',   // Deep forest green (typography + accents)
          900: '#081A12',
          800: '#0E2A1F',
          700: '#143C2A',
        },
        goa: {
          DEFAULT: '#026736',   // Saturated Goa palm/jungle green
          500: '#026736',
          600: '#014C28',
        },
        cream: {
          DEFAULT: '#F5EBD7',   // Warm cream — primary page background
          50: '#FBF6E8',
          100: '#F5EBD7',
          200: '#E9DAB7',
          300: '#DDC9A0',
        },
        sun: {
          DEFAULT: '#FFD23F',   // Bright yellow
          400: '#FFE070',
          bright: '#FEE101',    // Peak highlight (sunset disc)
          500: '#FFD23F',
          600: '#F2BE1F',
        },
        pink: {
          DEFAULT: '#FF2D7B',   // Bright magenta/pink
          500: '#FF2D7B',
          600: '#E51A66',
        },
      },
      fontFamily: {
        display: ['"Anton"', 'Impact', 'Haettenschweiler', '"Arial Narrow Bold"', 'sans-serif'],
        // Fallback chain intentionally puts Noto Serif Devanagari last so the
        // browser picks Fraunces for Latin glyphs and falls through to Noto
        // for the Devanagari block — perfect for the गोवा stamp on the hero.
        editorial: ['"Fraunces"', '"Noto Serif Devanagari"', '"DM Serif Display"', 'Georgia', 'serif'],
        body: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
        devanagari: ['"Noto Serif Devanagari"', '"Fraunces"', 'Georgia', 'serif'],
      },
      letterSpacing: {
        'tightest': '-0.05em',
        'super': '0.18em',
      },
      animation: {
        'marquee': 'marquee 30s linear infinite',
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

