'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
    Home,
    Folder,
    FileText,
    HelpCircle,
    ChevronLeft,
    Menu,
    X,
    ExternalLink,
    Github,
    Video,
    Tag,
    Database,
    Download,
    Search,
    Image as ImageIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const NAV_ITEMS = [
    { label: 'Overview', icon: Home, href: '/' },
    { label: 'Indexes', icon: Folder, href: '/indexes' },
];

function NavItem({ label, icon: Icon, active = false, collapsed = false, onClick, href, external }) {
    const cls = `
        flex items-center gap-3 px-6 py-2.5 text-sm transition-colors rounded-r-lg w-full
        ${active
            ? 'font-semibold text-[var(--text-primary)] gradient-wash'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-gray-100 dark:hover:bg-gray-800'
        }
        ${collapsed ? 'justify-center px-3' : ''}
    `;

    if (external && href) {
        return (
            <li className="relative">
                <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cls}
                >
                    <Icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                    {!collapsed && (
                        <span className="flex items-center gap-2">
                            {label}
                            <ExternalLink className="w-3 h-3 opacity-50" strokeWidth={2} />
                        </span>
                    )}
                </a>
            </li>
        );
    }

    if (href && !external) {
        return (
            <li className="relative">
                {active && (
                    <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full gradient-bg" />
                )}
                <Link href={href} className={cls}>
                    <Icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                    {!collapsed && <span>{label}</span>}
                </Link>
            </li>
        );
    }

    return (
        <li className="relative">
            {active && (
                <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full gradient-bg" />
            )}
            <button
                onClick={onClick}
                className={cls + ' cursor-pointer text-left'}
            >
                <Icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                {!collapsed && <span>{label}</span>}
            </button>
        </li>
    );
}

function HelpModal({ open, onClose }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg mx-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <div className="flex items-center gap-3">
                        <img
                            src="/TwelveLabs-Symbol.png"
                            alt="TwelveLabs"
                            className="h-10 w-auto rounded-xl object-contain"
                        />
                        <div>
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">
                                Automated Video Data Labeler
                            </h2>
                            <p className="text-xs text-[var(--text-tertiary)]">
                                Powered by TwelveLabs
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5 text-[var(--text-tertiary)]" strokeWidth={1.5} />
                    </button>
                </div>

                {/* Description */}
                <div className="px-6 pb-4">
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        Automatically generate structured training data labels for your video datasets using TwelveLabs' multimodal AI.
                        Replace manual video annotation workflows with AI-powered labeling that's faster, cheaper, and more consistent.
                    </p>
                </div>

                {/* Core Features */}
                <div className="px-6 pb-5">
                    <h3 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">
                        Core Features
                    </h3>
                    <ul className="space-y-2.5">
                        {[
                            { icon: Video, text: 'Upload and organize video datasets into indexes' },
                            { icon: Tag, text: 'AI-powered annotation with customizable label taxonomies' },
                            { icon: Search, text: 'Semantic search across video content and moments' },
                            { icon: Database, text: '2D embedding visualization with PCA clustering' },
                            { icon: Download, text: 'Export annotations in COCO, YOLO, or CSV formats' },
                        ].map(({ icon: FIcon, text }) => (
                            <li key={text} className="flex items-start gap-3">
                                <div className="p-1 rounded-md bg-gray-100 dark:bg-gray-800 shrink-0 mt-0.5">
                                    <FIcon className="w-3.5 h-3.5 text-[var(--text-secondary)]" strokeWidth={1.5} />
                                </div>
                                <span className="text-sm text-[var(--text-primary)]">{text}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Placeholders */}
                <div className="px-6 pb-5 space-y-3">
                    <div className="rounded-xl border border-dashed border-[var(--border)] bg-gray-50 dark:bg-gray-800/50 p-4 flex items-center gap-3">
                        <ImageIcon className="w-5 h-5 text-[var(--text-tertiary)]" strokeWidth={1.5} />
                        <div>
                            <p className="text-sm font-medium text-[var(--text-secondary)]">Architecture Diagram</p>
                            <p className="text-xs text-[var(--text-tertiary)]">To be added</p>
                        </div>
                    </div>
                    <div className="rounded-xl border border-dashed border-[var(--border)] bg-gray-50 dark:bg-gray-800/50 p-4 flex items-center gap-3">
                        <Video className="w-5 h-5 text-[var(--text-tertiary)]" strokeWidth={1.5} />
                        <div>
                            <p className="text-sm font-medium text-[var(--text-secondary)]">Demo Video</p>
                            <p className="text-xs text-[var(--text-tertiary)]">To be added</p>
                        </div>
                    </div>
                </div>

                {/* Footer with GitHub link */}
                <div className="px-6 py-4 border-t border-[var(--border)] bg-gray-50/50 dark:bg-gray-800/30">
                    <a
                        href="https://github.com/nathanchess/tl-automated-video-data-labeler"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <Github className="w-4.5 h-4.5" strokeWidth={1.5} />
                        <span>View Source Code on GitHub</span>
                        <ExternalLink className="w-3 h-3 opacity-50 ml-auto" strokeWidth={2} />
                    </a>
                </div>
            </div>
        </div>
    );
}

export default function Sidebar() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const pathname = usePathname();

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Brand */}
            <div className="flex flex-col items-center px-6 py-5 gap-3">
                {collapsed ? (
                    <Image
                        src="/TwelveLabs-Symbol.png"
                        alt="TwelveLabs"
                        width={56}
                        height={40}
                        className="rounded-md object-contain"
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
                <span
                    title={collapsed ? 'Demo App' : undefined}
                    className={`
                        gradient-border gradient-wash inline-flex items-center justify-center
                        rounded-lg font-semibold uppercase tracking-wider
                        text-primary-700 dark:text-primary-300
                        bg-primary-50/90 dark:bg-primary-500/10
                        ${collapsed ? 'w-8 h-8 text-[10px]' : 'px-3 py-1.5 text-[11px]'}
                    `}
                >
                    {collapsed ? 'D' : 'Demo App'}
                </span>
            </div>

            {/* Main nav */}
            <nav className="flex-1 mt-2">
                <ul className="space-y-0.5">
                    {NAV_ITEMS.map((item) => {
                        const isOverview = item.href === '/';
                        const isActive = isOverview
                            ? pathname === '/' || pathname === '/overview'
                            : pathname === '/indexes' || (pathname !== '/' && pathname !== '/overview' && pathname.startsWith('/') && !pathname.startsWith('/api'));
                        return (
                            <NavItem key={item.label} {...item} active={isActive} collapsed={collapsed} />
                        );
                    })}
                </ul>
            </nav>

            {/* Bottom actions */}
            <div className="border-t border-[var(--border)] pt-2 pb-4">
                <ul className="space-y-0.5">
                    <NavItem
                        label="API Docs"
                        icon={FileText}
                        collapsed={collapsed}
                        external
                        href="https://docs.twelvelabs.io/docs/get-started/introduction"
                    />
                    <NavItem
                        label="Help"
                        icon={HelpCircle}
                        collapsed={collapsed}
                        onClick={() => setHelpOpen(true)}
                    />
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

            {/* Help Modal */}
            <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
        </>
    );
}
