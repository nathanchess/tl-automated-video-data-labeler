/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './src/**/*.{js,jsx,ts,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
            },
            colors: {
                primary: {
                    50: '#F7FEE7',
                    100: '#ECFCCB',
                    200: '#D9F99D',
                    300: '#BEF264',
                    400: '#A3E635',
                    500: '#84CC16',
                    600: '#65A30D',
                    700: '#4D7C0F',
                },
                secondary: {
                    50: '#FFFBEB',
                    100: '#FEF3C7',
                    200: '#FDE68A',
                    300: '#FCD34D',
                    400: '#FBBF24',
                    500: '#F59E0B',
                    600: '#D97706',
                },
            },
            borderRadius: {
                card: '1rem',
            },
            boxShadow: {
                card: '0 6px 14px rgba(0,0,0,0.05)',
                'card-hover': '0 12px 24px rgba(0,0,0,0.08)',
            },
        },
    },
    plugins: [],
};
