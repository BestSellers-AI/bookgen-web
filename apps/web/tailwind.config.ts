import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: "class",
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                navy: {
                    950: '#06080F',
                    900: '#0D0F1C',
                    800: '#131627',
                    700: '#191D31',
                    600: '#202440',
                },
                gold: {
                    100: '#FEF3C7',
                    200: '#FDE68A',
                    300: '#FCD34D',
                    400: '#FBBF24',
                    500: '#F59E0B',
                    600: '#D97706',
                    700: '#B45309',
                },
                cream: {
                    50: '#FFFEF7',
                    100: '#FEFCE8',
                    200: '#F5F0E8',
                    300: '#EDE5D4',
                    400: '#C4B99E',
                    500: '#9C8E78',
                    600: '#7A6F5A',
                },
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                }
            },
            fontFamily: {
                playfair: ['var(--font-playfair)', 'Georgia', 'serif'],
                heading: ['var(--font-playfair)', 'Georgia', 'serif'],
                inter: ['var(--font-inter)', 'system-ui', 'sans-serif'],
            },
            backgroundImage: {
                'hero-radial': `radial-gradient(ellipse at 20% 60%, rgba(245,158,11,0.09) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(245,158,11,0.06) 0%, transparent 45%)`,
                'gold-gradient': 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                'card-popular': 'linear-gradient(145deg, rgba(245,158,11,0.10) 0%, rgba(245,158,11,0.04) 100%)',
            },
            animation: {
                'fade-up': 'fadeUp 0.6s ease-out forwards',
                'pulse-gold': 'pulseGold 2.5s ease-in-out infinite',
            },
            keyframes: {
                fadeUp: {
                    '0%': { opacity: '0', transform: 'translateY(24px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                pulseGold: {
                    '0%, 100%': { boxShadow: '0 0 0 0 rgba(245,158,11,0.35)' },
                    '50%': { boxShadow: '0 0 0 10px rgba(245,158,11,0)' },
                },
            },
            boxShadow: {
                'gold-sm': '0 0 20px rgba(245,158,11,0.15)',
                'gold-md': '0 0 40px rgba(245,158,11,0.20)',
                'gold-lg': '0 0 60px rgba(245,158,11,0.25)',
                'card': '0 4px 24px rgba(0,0,0,0.4)',
                'card-hover': '0 8px 40px rgba(0,0,0,0.5)',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
};
export default config;
