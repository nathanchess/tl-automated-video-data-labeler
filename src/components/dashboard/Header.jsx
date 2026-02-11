'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Info, Check } from 'lucide-react';
import ThemeSwitch from '@/components/ThemeSwitch';

const TOOLTIP_TEXT =
    'An Index is a collection of videos representing your unannotated video dataset. Once created, it will be batch-processed by TwelveLabs Marengo and Pegasus to generate a training-ready PyTorch dataset.';

const SORT_OPTIONS = [
    { value: 'date', label: 'Date created' },
    { value: 'duration', label: 'Duration' },
    { value: 'videoCount', label: 'Video count' },
];

export default function Header({ sortBy, onSortChange, filterQuery, onFilterChange }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const [sortOpen, setSortOpen] = useState(false);
    const sortRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e) {
            if (sortRef.current && !sortRef.current.contains(e.target)) {
                setSortOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const activeLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Date created';

    return (
        <header className="flex flex-wrap items-center justify-between gap-4 mb-8">
            {/* Left: Title */}
            <div className="flex items-center gap-2 relative">
                <h1 className="text-2xl font-bold text-[var(--text-secondary)]">
                    Sample Indexes
                </h1>
                <button
                    className="relative cursor-pointer"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    aria-label="What is an Index?"
                >
                    <Info className="w-5 h-5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors" strokeWidth={1.5} />

                    {/* Tooltip */}
                    {showTooltip && (
                        <div className="absolute left-1/2 -translate-x-1/2 top-8 z-50 w-72 px-3 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-card-hover text-xs text-[var(--text-secondary)] leading-relaxed animate-tooltip">
                            {TOOLTIP_TEXT}
                        </div>
                    )}
                </button>
            </div>

            {/* Right: Controls */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Filter input */}
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] min-w-0">
                    <Search className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" strokeWidth={1.5} />
                    <input
                        type="text"
                        value={filterQuery}
                        onChange={(e) => onFilterChange(e.target.value)}
                        placeholder="Filter by Index name"
                        className="text-sm bg-transparent outline-none text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] w-40"
                    />
                </div>

                {/* Sort dropdown */}
                <div className="relative" ref={sortRef}>
                    <button
                        onClick={() => setSortOpen((prev) => !prev)}
                        className="flex items-center gap-2 text-sm text-[var(--text-secondary)] bg-[var(--surface)] border border-[var(--border)] rounded-xl px-3 py-2 hover:border-primary-400 transition-colors cursor-pointer"
                    >
                        <span>Sort by {activeLabel}</span>
                        <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`}
                            strokeWidth={1.5}
                        />
                    </button>

                    {/* Dropdown menu */}
                    {sortOpen && (
                        <div className="absolute right-0 mt-2 z-50 w-48 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-lg overflow-hidden">
                            {SORT_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => {
                                        onSortChange(option.value);
                                        setSortOpen(false);
                                    }}
                                    className="flex items-center justify-between w-full px-3.5 py-2.5 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                                >
                                    <span
                                        className={
                                            sortBy === option.value
                                                ? 'text-[var(--text-primary)] font-medium'
                                                : 'text-[var(--text-secondary)]'
                                        }
                                    >
                                        {option.label}
                                    </span>
                                    {sortBy === option.value && (
                                        <Check className="w-4 h-4 text-primary-500" strokeWidth={2} />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Theme switch */}
                <ThemeSwitch />
            </div>
        </header>
    );
}
