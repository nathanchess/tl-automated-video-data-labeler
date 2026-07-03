import { IBM_Plex_Mono } from 'next/font/google';
import { TooltipProvider } from '@twelvelabs-io/react';
import './globals.css';

const ibmPlexMono = IBM_Plex_Mono({
    variable: '--font-tl-mono-loaded',
    subsets: ['latin'],
    weight: ['400', '500'],
});

export const metadata = {
    title: 'TwelveLabs — Automated Video Data Labeler',
    description:
        'AI-powered video understanding and automated data labeling dashboard',
    icons: {
        icon: '/favicon.ico',
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="en" suppressHydrationWarning className={ibmPlexMono.variable}>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
                    }}
                />
                <style
                    dangerouslySetInnerHTML={{
                        __html: `:root { --tl-font-family-mono: var(--font-tl-mono-loaded), "IBM Plex Mono", ui-monospace, monospace; }`,
                    }}
                />
            </head>
            <body className="min-h-screen bg-surface-body font-tl-sans text-foreground-body antialiased">
                <TooltipProvider>{children}</TooltipProvider>
            </body>
        </html>
    );
}
