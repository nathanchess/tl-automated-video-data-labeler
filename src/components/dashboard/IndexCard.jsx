import { MoreVertical } from 'lucide-react';

export default function IndexCard({ title, description, videoCount, date, duration, thumbnails }) {
    return (
        <div
            className="
        group relative rounded-2xl bg-[var(--surface)] border border-[var(--border)]
        overflow-hidden cursor-pointer card-lift shadow-card
      "
        >
            {/* Hover bottom glow */}
            <div
                className="
          absolute bottom-0 left-0 right-0 h-[3px]
          gradient-bg opacity-0 group-hover:opacity-100
          transition-opacity duration-200 z-10
        "
            />

            {/* Thumbnail 2×2 bento grid */}
            <div className="grid grid-cols-2 grid-rows-2 gap-0.5 aspect-[2/1] bg-gray-100 dark:bg-gray-800 relative">
                {thumbnails.map((src, i) => (
                    <img
                        key={i}
                        src={src}
                        alt={`${title} thumbnail ${i + 1}`}
                        className="object-cover w-full h-full"
                        loading="lazy"
                    />
                ))}

                {/* Video count pill */}
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs font-mono">
                    {videoCount} videos
                </span>
            </div>

            {/* Meta area */}
            <div className="p-4 flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {title}
                    </h3>
                    {description && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">
                            {description}
                        </p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-[var(--text-tertiary)]">{date}</span>
                        <span className="text-xs text-[var(--text-tertiary)] font-mono">
                            {duration}
                        </span>
                    </div>
                </div>

                {/* Kebab menu */}
                <button
                    className="
            p-1 rounded-lg opacity-0 group-hover:opacity-100
            hover:bg-gray-100 dark:hover:bg-gray-700
            transition-all cursor-pointer shrink-0
          "
                    aria-label="More options"
                >
                    <MoreVertical className="w-4 h-4 text-[var(--text-tertiary)]" strokeWidth={1.5} />
                </button>
            </div>
        </div>
    );
}
