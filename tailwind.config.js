/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./pages/**/*.{ts,tsx,js,jsx}",
        "./components/**/*.{ts,tsx,js,jsx}",
        "./lib/**/*.{ts,tsx,js,jsx}",
        "./Layout.{js,jsx,ts,tsx}",
        "./*.{js,jsx,ts,tsx}",
        "./src/**/*.{ts,tsx,js,jsx}"
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
                display: ['Outfit', 'Inter', 'sans-serif'],
            },
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                calendar: {
                    blue: "hsl(var(--calendar-blue))",
                    yellow: "hsl(var(--calendar-yellow))",
                    "green-light": "hsl(var(--calendar-green-light))",
                    pink: "hsl(var(--calendar-pink))",
                    green: "hsl(var(--calendar-green))",
                    purple: "hsl(var(--calendar-purple))",
                    gray: "hsl(var(--calendar-gray))",
                    holiday: "hsl(var(--calendar-holiday))",
                },
                // Mobile Dashboard Palette
                sage: {
                    DEFAULT: "#C6D1C0",
                    light: "#D8E2D3",
                    dark: "#A5B29E",
                },
                "off-black": "#1D1D1D",
                "dark-gray": "#2B2B2B",
                "pale-yellow": "#F9E58C",
                "soft-red": "#F25C54",
                "cool-blue": "#5A7BEF",
                "bright-orange": "#F7941D",
                "pastel-pink": "#FAD6DC",
                status: {
                    success: "#9FE6A0",
                    warning: "#FFD966",
                    error: "#FF6B6B",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "shimmer": {
                    "0%": { backgroundPosition: "-1000px 0" },
                    "100%": { backgroundPosition: "1000px 0" },
                },
                "float": {
                    "0%, 100%": { transform: "translateY(0px)" },
                    "50%": { transform: "translateY(-10px)" },
                },
                "pulse-soft": {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.8" },
                },
                "slide-up": {
                    "0%": { transform: "translateY(10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
                "slide-down": {
                    "0%": { transform: "translateY(-10px)", opacity: "0" },
                    "100%": { transform: "translateY(0)", opacity: "1" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "shimmer": "shimmer 3s infinite",
                "float": "float 3s ease-in-out infinite",
                "pulse-soft": "pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "slide-up": "slide-up 0.3s ease-out",
                "slide-down": "slide-down 0.3s ease-out",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
}
