'use client';

import { useMemo, useRef, useCallback, useEffect } from 'react';
import { Search, Film, X, Clock, Monitor, Gauge, CheckCircle2 } from 'lucide-react';
import Hls from 'hls.js';

/** Pretty-print seconds → 0:04 / 1:23:45 */
function formatDuration(s) {
    if (!s && s !== 0) return '—';
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = Math.floor(s % 60);
    if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

/** Pretty-print bytes → KB / MB / GB */
function formatBytes(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(2) + ' GB';
}

/** Format ISO date to readable string */
function formatDate(isoString) {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/** Individual video card with hover-to-play */
function VideoCard({ video, isSelected, onToggleSelect }) {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const sys = video.systemMetadata || {};
    const filename = sys.filename || video.id;
    const duration = sys.duration;
    const fps = sys.fps;
    const width = sys.width;
    const height = sys.height;
    const size = sys.size;
    const thumbnailUrl = video.hls?.thumbnail_urls?.[0];
    const hlsUrl = video.hls?.video_url;
    const createdAt = video.createdAt;

    // Clean up HLS on unmount
    useEffect(() => {
        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, []);

    const handleMouseEnter = useCallback(() => {
        const videoEl = videoRef.current;
        if (!videoEl || !hlsUrl) return;

        // Show the video element over the thumbnail
        videoEl.style.opacity = '1';

        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: false,
                lowLatencyMode: false,
                maxBufferLength: 5,
                maxMaxBufferLength: 10,
            });
            hls.loadSource(hlsUrl);
            hls.attachMedia(videoEl);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoEl.play().catch(() => { });
            });
            hlsRef.current = hls;
        } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS (Safari)
            videoEl.src = hlsUrl;
            videoEl.play().catch(() => { });
        }
    }, [hlsUrl]);

    const handleMouseLeave = useCallback(() => {
        const videoEl = videoRef.current;
        if (!videoEl) return;

        // Hide video, show thumbnail
        videoEl.style.opacity = '0';
        videoEl.pause();
        videoEl.removeAttribute('src');
        videoEl.load();

        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
    }, []);

    return (
        <div
            onClick={() => onToggleSelect(video.id)}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`
                group relative rounded-2xl bg-[var(--surface)] border-2 overflow-hidden shadow-card card-lift cursor-pointer transition-all duration-150
                ${isSelected
                    ? 'border-primary-500 ring-2 ring-primary-400/30'
                    : 'border-[var(--border)] hover:border-[var(--text-tertiary)]'}
            `}
        >
            {/* Hover glow */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] gradient-bg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10" />

            {/* Selection check */}
            <div className={`
                absolute top-3 left-3 z-20 transition-all duration-150
                ${isSelected ? 'opacity-100 scale-100' : 'opacity-0 scale-75 group-hover:opacity-60 group-hover:scale-100'}
            `}>
                <div className={`
                    w-6 h-6 rounded-full flex items-center justify-center
                    ${isSelected
                        ? 'bg-primary-500 text-gray-900'
                        : 'bg-black/40 text-white backdrop-blur-sm'}
                `}>
                    <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} />
                </div>
            </div>

            {/* Thumbnail + hover video */}
            <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                {/* Thumbnail (always behind) */}
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={filename}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <Film className="w-10 h-10 text-[var(--text-tertiary)]" strokeWidth={1} />
                )}

                {/* Video overlay (hidden until hover) */}
                {hlsUrl && (
                    <video
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                        style={{ opacity: 0 }}
                        muted
                        loop
                        playsInline
                    />
                )}

                {/* Duration pill */}
                {duration && (
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-xs font-mono z-10">
                        {formatDuration(duration)}
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate mb-3" title={filename}>
                    {filename}
                </h3>

                {/* System metadata stats */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3">
                    {fps && (
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                            <Gauge className="w-3.5 h-3.5 text-[var(--text-tertiary)]" strokeWidth={1.5} />
                            <span className="font-mono">{Math.round(fps)} fps</span>
                        </div>
                    )}
                    {width && height && (
                        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                            <Monitor className="w-3.5 h-3.5 text-[var(--text-tertiary)]" strokeWidth={1.5} />
                            <span className="font-mono">{width}×{height}</span>
                        </div>
                    )}
                    {size && (
                        <span className="text-xs text-[var(--text-tertiary)] font-mono">
                            {formatBytes(size)}
                        </span>
                    )}
                </div>

                {/* Date */}
                {createdAt && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
                        <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span>{formatDate(createdAt)}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VideoList({ videos, indexName, search, onSearchChange, selectedIds, onToggleSelect }) {
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return videos;

        return videos.filter((v) => {
            const sys = v.systemMetadata || {};
            const haystack = [sys.filename || ''].join(' ').toLowerCase();
            return haystack.includes(q);
        });
    }, [videos, search]);

    if (videos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <Film className="w-12 h-12 text-[var(--text-tertiary)] mb-4" strokeWidth={1} />
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                    No videos found
                </h3>
                <p className="text-sm text-[var(--text-secondary)] max-w-md">
                    No videos with metadata matching &ldquo;{indexName}&rdquo; were found in this index.
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Search / filter bar */}
            <div className="relative mb-6 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" strokeWidth={1.5} />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Search videos…"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition"
                />
                {search && (
                    <button
                        onClick={() => onSearchChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        aria-label="Clear search"
                    >
                        <X className="w-3.5 h-3.5 text-[var(--text-tertiary)]" strokeWidth={2} />
                    </button>
                )}
            </div>

            {/* Results count */}
            {search && (
                <p className="text-xs text-[var(--text-secondary)] mb-4">
                    Showing {filtered.length} of {videos.length} video{videos.length !== 1 ? 's' : ''}
                </p>
            )}

            {/* Video cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((video) => (
                    <VideoCard
                        key={video.id}
                        video={video}
                        isSelected={selectedIds.has(video.id)}
                        onToggleSelect={onToggleSelect}
                    />
                ))}
            </div>

            {/* No results for filter */}
            {filtered.length === 0 && search && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Search className="w-8 h-8 text-[var(--text-tertiary)] mb-3" strokeWidth={1} />
                    <p className="text-sm text-[var(--text-secondary)]">
                        No videos matching &ldquo;{search}&rdquo;
                    </p>
                </div>
            )}
        </div>
    );
}
