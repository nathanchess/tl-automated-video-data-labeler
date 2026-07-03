'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
    HomeIcon,
    IndexesIcon,
    TextIcon,
    HelpIcon,
    ChevronLeftIcon,
    MenuIcon,
    CloseIcon,
    ArrowDiagonalIcon,
    IntegrationIcon,
    VideoIcon,
    EntityIcon,
    ServersIcon,
    DownloadIcon,
    SearchIcon,
    Chip,
    TwelveLabsLogo,
    TwelveLabsLogoMark,
} from '@twelvelabs-io/react';
import Link from 'next/link';

const NAV_ITEMS = [
    { label: 'Overview', icon: HomeIcon, href: '/' },
    { label: 'Indexes', icon: IndexesIcon, href: '/indexes' },
];

function NavItem({ label, icon: Icon, active = false, collapsed = false, onClick, href, external }) {
    const cls = `
        flex items-center gap-3 px-6 py-2.5 text-sm transition-colors rounded-r-lg w-full
        ${active
            ? 'font-semibold text-foreground-body gradient-wash'
            : 'text-foreground-secondary hover:text-foreground-body hover:bg-surface-card'
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
                    <Icon className="w-5 h-5 shrink-0" />
                    {!collapsed && (
                        <span className="flex items-center gap-2">
                            {label}
                            <ArrowDiagonalIcon className="w-3 h-3 opacity-50" />
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
                    <Icon className="w-5 h-5 shrink-0" />
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
                <Icon className="w-5 h-5 shrink-0" />
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
            <div className="relative w-full max-w-lg mx-4 bg-surface-white rounded-2xl border border-border-secondary shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <div className="flex items-center gap-3">
                        <img
                            src="/TwelveLabs-Symbol.png"
                            alt="TwelveLabs"
                            className="h-10 w-auto rounded-xl object-contain"
                        />
                        <div>
                            <h2 className="text-lg font-bold text-foreground-body">
                                Automated Video Data Labeler
                            </h2>
                            <p className="text-xs text-foreground-subtle">
                                Powered by TwelveLabs
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-surface-card transition-colors cursor-pointer"
                    >
                        <CloseIcon className="w-5 h-5 text-foreground-subtle" />
                    </button>
                </div>

                {/* Description */}
                <div className="px-6 pb-4">
                    <p className="text-sm text-foreground-secondary leading-relaxed">
                        Automatically generate structured training data labels for your video datasets using TwelveLabs' multimodal AI.
                        Replace manual video annotation workflows with AI-powered labeling that's faster, cheaper, and more consistent.
                    </p>
                </div>

                {/* Core Features */}
                <div className="px-6 pb-5">
                    <h3 className="text-xs font-semibold text-foreground-subtle uppercase tracking-wider mb-3">
                        Core Features
                    </h3>
                    <ul className="space-y-2.5">
                        {[
                            { icon: VideoIcon, text: 'Upload and organize video datasets into indexes' },
                            { icon: EntityIcon, text: 'AI-powered annotation with customizable label taxonomies' },
                            { icon: SearchIcon, text: 'Semantic search across video content and moments' },
                            { icon: ServersIcon, text: '2D embedding visualization with PCA clustering' },
                            { icon: DownloadIcon, text: 'Export annotations in COCO, YOLO, or CSV formats' },
                        ].map(({ icon: FIcon, text }) => (
                            <li key={text} className="flex items-start gap-3">
                                <div className="p-1 rounded-md bg-surface-card shrink-0 mt-0.5">
                                    <FIcon className="w-3.5 h-3.5 text-foreground-secondary" />
                                </div>
                                <span className="text-sm text-foreground-body">{text}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Footer with GitHub link */}
                <div className="px-6 py-4 border-t border-border-secondary bg-surface-card/50">
                    <a
                        href="https://github.com/nathanchess/tl-automated-video-data-labeler"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 text-sm font-medium text-foreground-secondary hover:text-foreground-body transition-colors"
                    >
                        <IntegrationIcon className="w-4.5 h-4.5" />
                        <span>View Source Code on GitHub</span>
                        <ArrowDiagonalIcon className="w-3 h-3 opacity-50 ml-auto" />
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
                    <TwelveLabsLogoMark className="size-10" />
                ) : (
                    <TwelveLabsLogo className="h-10 max-w-[160px]" />
                )}
                {collapsed ? (
                    <Chip
                        variant="gray-outline"
                        size="sm"
                        uppercase
                        title="Demo App"
                        className="tracking-wider"
                    >
                        D
                    </Chip>
                ) : (
                    <Chip variant="gray-outline" size="sm" uppercase className="tracking-wider">
                        Demo App
                    </Chip>
                )}
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
            <div className="border-t border-border-secondary pt-2 pb-4">
                <ul className="space-y-0.5">
                    <NavItem
                        label="API Docs"
                        icon={TextIcon}
                        collapsed={collapsed}
                        external
                        href="https://docs.twelvelabs.io/docs/get-started/introduction"
                    />
                    <NavItem
                        label="Help"
                        icon={HelpIcon}
                        collapsed={collapsed}
                        onClick={() => setHelpOpen(true)}
                    />
                </ul>
                {/* Collapse toggle — desktop only */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="hidden lg:flex items-center gap-3 px-6 py-2.5 text-sm text-foreground-secondary hover:text-foreground-body transition-colors w-full cursor-pointer"
                >
                    <ChevronLeftIcon
                        className={`w-5 h-5 shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`}
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
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface-white border border-border-secondary shadow-card cursor-pointer"
                aria-label="Open menu"
            >
                <MenuIcon className="w-5 h-5 text-foreground-body" />
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
                    bg-surface-white border-r border-border-secondary
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
                        className="lg:hidden absolute top-4 right-4 p-1 rounded-lg hover:bg-surface-card cursor-pointer"
                        aria-label="Close menu"
                    >
                        <CloseIcon className="w-5 h-5 text-foreground-body" />
                    </button>
                )}

                {sidebarContent}
            </aside>

            {/* Help Modal */}
            <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
        </>
    );
}
