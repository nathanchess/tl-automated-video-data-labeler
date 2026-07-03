import Link from 'next/link';
import { EllipsisIcon } from '@twelvelabs-io/react';

const PLACEHOLDER_THUMB =
    'data:image/svg+xml,' +
    encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" fill="none"><rect width="400" height="300" fill="#ececec"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="system-ui" font-size="14" fill="#8f8984">No preview</text></svg>`,
    );

export default function IndexCard({ title, description, videoCount, date, duration, thumbnails }) {
    const thumbs = [...(thumbnails || [])];
    while (thumbs.length < 4) {
        thumbs.push(PLACEHOLDER_THUMB);
    }

    return (
        <Link
            href={`/${encodeURIComponent(title)}`}
            className="group relative block cursor-pointer overflow-hidden rounded-2xl border border-border-secondary bg-surface-white no-underline card-lift shadow-card"
        >
            <div className="absolute bottom-0 left-0 right-0 z-10 h-[3px] gradient-bg opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

            <div className="relative grid aspect-[2/1] grid-cols-2 grid-rows-2 gap-0.5 bg-surface-card">
                {thumbs.slice(0, 4).map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        key={i}
                        src={src}
                        alt={`${title} thumbnail ${i + 1}`}
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                ))}

                <span className="absolute right-2 top-2 rounded-full bg-surface-primary/80 px-2 py-0.5 font-tl-mono text-xs text-foreground-primary">
                    {videoCount} video{videoCount !== 1 ? 's' : ''}
                </span>
            </div>

            <div className="flex items-start justify-between gap-2 p-4">
                <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-foreground-body">{title}</h3>
                    {description && (
                        <p className="mt-1 line-clamp-2 text-xs text-foreground-secondary">{description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-3">
                        <span className="text-xs text-foreground-subtle">{date}</span>
                        <span className="font-tl-mono text-xs text-foreground-subtle">{duration}</span>
                    </div>
                </div>

                <button
                    type="button"
                    className="shrink-0 cursor-pointer rounded-lg p-1 opacity-0 transition-all hover:bg-surface-card group-hover:opacity-100"
                    aria-label="More options"
                    onClick={(e) => e.preventDefault()}
                >
                    <EllipsisIcon className="size-4 text-foreground-subtle" />
                </button>
            </div>
        </Link>
    );
}
