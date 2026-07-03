'use client';

import { useState, useRef, useEffect } from 'react';
import { SearchIcon, ChevronDownIcon, InfoIcon, CheckIcon } from '@twelvelabs-io/react';
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
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground-secondary">Sample Indexes</h1>
                <button
                    type="button"
                    className="relative cursor-pointer"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    aria-label="What is an Index?"
                >
                    <InfoIcon className="size-5 text-foreground-subtle transition-colors hover:text-foreground-secondary" />

                    {showTooltip && (
                        <div className="animate-tooltip absolute left-1/2 top-8 z-50 w-72 -translate-x-1/2 rounded-xl border border-border-secondary bg-surface-white px-3 py-2.5 text-xs leading-relaxed text-foreground-secondary shadow-card-hover">
                            {TOOLTIP_TEXT}
                        </div>
                    )}
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border-secondary bg-surface-white px-3 py-2">
                    <SearchIcon className="size-4 shrink-0 text-foreground-subtle" />
                    <input
                        type="text"
                        value={filterQuery}
                        onChange={(e) => onFilterChange(e.target.value)}
                        placeholder="Filter by Index name"
                        className="w-40 bg-transparent text-sm text-foreground-body outline-none placeholder:text-foreground-subtle"
                    />
                </div>

                <div className="relative" ref={sortRef}>
                    <button
                        type="button"
                        onClick={() => setSortOpen((prev) => !prev)}
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-border-secondary bg-surface-white px-3 py-2 text-sm text-foreground-secondary transition-colors hover:border-tl-master-brand-light-green"
                    >
                        <span>Sort by {activeLabel}</span>
                        <ChevronDownIcon
                            className={`size-4 transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {sortOpen && (
                        <div className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-border-secondary bg-surface-white shadow-lg">
                            {SORT_OPTIONS.map((option) => (
                                <button
                                    type="button"
                                    key={option.value}
                                    onClick={() => {
                                        onSortChange(option.value);
                                        setSortOpen(false);
                                    }}
                                    className="flex w-full cursor-pointer items-center justify-between px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-surface-card"
                                >
                                    <span
                                        className={
                                            sortBy === option.value
                                                ? 'font-medium text-foreground-body'
                                                : 'text-foreground-secondary'
                                        }
                                    >
                                        {option.label}
                                    </span>
                                    {sortBy === option.value && (
                                        <CheckIcon className="size-4 text-tl-master-brand-green" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <ThemeSwitch />
            </div>
        </header>
    );
}
