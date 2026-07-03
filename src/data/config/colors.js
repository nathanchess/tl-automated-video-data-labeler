/** TwelveLabs design tokens (tl-ui) — semantic aliases for non-Tailwind usage. */
export const colors = {
    light: {
        primary: {
            lightest: '#d4f8e4',
            light: '#bff3a4',
            DEFAULT: '#60e21b',
            dark: '#30710e',
        },
        secondary: {
            lightest: '#fff2d1',
            light: '#fde3a2',
            DEFAULT: '#faba17',
            dark: '#7d5d0c',
        },
        gray: {
            50: '#f4f3f3',
            100: '#ececec',
            200: '#e2e2e2',
            300: '#d3d1cf',
            400: '#bdbcbb',
            500: '#8f8984',
            600: '#45423f',
            700: '#1d1c1b',
        },
        base: {
            background: '#f4f3f3',
            surface: '#ffffff',
            textPrimary: '#1d1c1b',
            textSecondary: '#1d1c1b',
            textTertiary: '#8f8984',
            border: '#d3d1cf',
        },
    },
    dark: {
        base: {
            background: '#1d1c1b',
            surface: '#2a2826',
            textPrimary: '#f4f3f3',
            textSecondary: '#d3d1cf',
            textTertiary: '#8f8984',
            border: '#bdbcbb',
        },
    },
    gradient:
        'linear-gradient(135deg, var(--tl-color-master-brand-green) 0%, var(--tl-color-master-brand-orange) 100%)',
};
