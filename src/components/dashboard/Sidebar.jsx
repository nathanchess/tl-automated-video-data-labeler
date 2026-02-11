'use client';

import { useState } from 'react';
import {
    Home,
    Folder,
    GitBranch,
    Settings,
    FileText,
    HelpCircle,
    ChevronLeft,
    Menu,
    X,
} from 'lucide-react';
import Image from 'next/image';

const NAV_ITEMS = [
    { label: 'Overview', icon: Home },
    { label: 'Indexes', icon: Folder, active: true },
    { label: 'Examples', icon: GitBranch },
];

const BOTTOM_ITEMS = [
    { label: 'Settings', icon: Settings },
    { label: 'API Docs', icon: FileText },
    { label: 'Help', icon: HelpCircle },
];

function NavItem({ label, icon: Icon, active = false, collapsed = false }) {
    return (
        <li className="relative">
            {/* Active gradient pill */}
            {active && (
                <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full gradient-bg" />
            )}
            <a
                href="#"
                className={`
          flex items-center gap-3 px-6 py-2.5 text-sm transition-colors rounded-r-lg
          ${active
                        ? 'font-semibold text-[var(--text-primary)] gradient-wash'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
          ${collapsed ? 'justify-center px-3' : ''}
        `}
            >
                <Icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                {!collapsed && <span>{label}</span>}
            </a>
        </li>
    );
}

export default function Sidebar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Brand */}
            <div className="flex items-center justify-center px-6 py-5">
                {collapsed ? (
                    <Image
                        src="/TwelveLabs-Symbol.png"
                        alt="TwelveLabs"
                        width={40}
                        height={40}
                        className="rounded-md"
                    />
                ) : (
                    <Image
                        src="/twelvelabs_logo.jpg"
                        alt="TwelveLabs"
                        width={160}
                        height={160}
                        className="rounded-lg"
                    />
                )}
            </div>

            {/* Main nav */}
            <nav className="flex-1 mt-2">
                <ul className="space-y-0.5">
                    {NAV_ITEMS.map((item) => (
                        <NavItem key={item.label} {...item} collapsed={collapsed} />
                    ))}
                </ul>
            </nav>

            {/* Bottom actions */}
            <div className="border-t border-[var(--border)] pt-2 pb-4">
                <ul className="space-y-0.5">
                    {BOTTOM_ITEMS.map((item) => (
                        <NavItem key={item.label} {...item} collapsed={collapsed} />
                    ))}
                </ul>
                {/* Collapse toggle — desktop only */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden lg:flex items-center gap-3 px-6 py-2.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors w-full cursor-pointer"
                >
                    <ChevronLeft
                        className={`w-5 h-5 shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`}
                        strokeWidth={1.5}
                    />
                    {!collapsed && <span>Collapse</span>}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile hamburger */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] shadow-card cursor-pointer"
                aria-label="Open menu"
            >
                <Menu className="w-5 h-5 text-[var(--text-primary)]" strokeWidth={1.5} />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar panel */}
            <aside
                className={`
          fixed left-0 top-0 h-screen z-40
          bg-[var(--surface)] border-r border-[var(--border)]
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-16' : 'w-60'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
            >
                {/* Mobile close */}
                {mobileOpen && (
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="lg:hidden absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                        aria-label="Close menu"
                    >
                        <X className="w-5 h-5 text-[var(--text-primary)]" strokeWidth={1.5} />
                    </button>
                )}

                {sidebarContent}
            </aside>
        </>
    );
}
