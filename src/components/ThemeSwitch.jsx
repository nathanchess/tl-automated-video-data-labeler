'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@twelvelabs-io/react';

export default function ThemeSwitch() {
    const [dark, setDark] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setDark(document.documentElement.classList.contains('dark'));
    }, []);

    const toggle = (next) => {
        setDark(next);
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
    };

    if (!mounted) {
        return <div className="h-5 w-[4.5rem]" />;
    }

    return (
        <label className="flex cursor-pointer items-center gap-2 select-none">
            <span className="text-xs text-foreground-subtle">{dark ? 'Dark' : 'Light'}</span>
            <Switch
                size="sm"
                checked={dark}
                onCheckedChange={toggle}
                aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            />
        </label>
    );
}
