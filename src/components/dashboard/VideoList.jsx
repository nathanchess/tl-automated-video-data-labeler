
'use client';

import { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { Search, Film, X, Clock, Monitor, Gauge, CheckCircle2, ExternalLink, Sparkles } from 'lucide-react';
import Link from 'next/link';
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

const STATUS_CONFIG = {
    ready: {
        color: 'bg-green-500',
        ring: 'ring-green-500/30',
        label: 'Ready',
        description: 'Label annotation complete',
    },
    processing: {
        color: 'bg-amber-500',
        ring: 'ring-amber-500/30',
        label: 'Processing',
        description: 'TwelveLabs is currently watching',
        pulse: true,
    },
    needs_review: {
        color: 'bg-red-500',
        ring: 'ring-red-500/30',
        label: 'Needs Review',
        description: 'Low confidence score, human reviewer needed',
    },
};

/** Status indicator dot with animated tooltip */
function StatusIndicator({ status }) {
    const [showTooltip, setShowTooltip] = useState(false);
    const cfg = STATUS_CONFIG[status];
    if (!cfg) return null;

    return (
        <div
            className="relative z-20"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            {/* Dot */}
            <div className={`w-3 h-3 rounded-full ${cfg.color} ring-4 ${cfg.ring} ${cfg.pulse ? 'animate-pulse' : ''}`} />

            {/* Tooltip */}
            <div
                className={`
                    absolute right-0 top-full mt-2 px-3 py-2 rounded-lg
                    bg-gray-900 dark:bg-gray-800 shadow-lg border border-gray-700
                    whitespace-nowrap pointer-events-none
                    transition-all duration-200 origin-top-right
                    ${showTooltip
                        ? 'opacity-100 scale-100 translate-y-0'
                        : 'opacity-0 scale-95 -translate-y-1'}
                `}
            >
                <div className="flex items-center gap-2 mb-0.5">
                    <div className={`w-2 h-2 rounded-full ${cfg.color}`} />
                    <span className="text-xs font-semibold text-white">{cfg.label}</span>
                </div>
                <p className="text-[10px] text-gray-400">{cfg.description}</p>
                {/* Arrow */}
                <div className="absolute -top-1 right-3 w-2 h-2 rotate-45 bg-gray-900 dark:bg-gray-800 border-l border-t border-gray-700" />
            </div>
        </div>
    );
}

/** Individual video card with hover-to-play */
function VideoCard({ video, isSelected, onToggleSelect, status, indexName, matches }) {
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const sys = video.systemMetadata || {};
    const filename = sys.filename || video.id;
    const duration = sys.duration;
    const fps = sys.fps;
    const width = sys.width;
    const height = sys.height;
    const size = sys.size;

    // Semantic Search Context
    const bestMatch = matches && matches.length > 0 ? matches[0] : null;
    const matchCount = matches ? matches.length : 0;

    // Prefer match thumbnail if available
    const thumbnailUrl = bestMatch?.thumbnailUrl || video.hls?.thumbnail_urls?.[0];
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

        // Wait a tiny bit (simulate loading) or start playing immediately
        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: false,
                lowLatencyMode: false,
                maxBufferLength: 5,
                maxMaxBufferLength: 10,
                startPosition: bestMatch ? bestMatch.start : -1
            });
            hls.loadSource(hlsUrl);
            hls.attachMedia(videoEl);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoEl.currentTime = bestMatch ? bestMatch.start : 0;
                videoEl.play().catch(() => { });
            });
            hlsRef.current = hls;
        } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS (Safari)
            videoEl.src = hlsUrl;
            videoEl.currentTime = bestMatch ? bestMatch.start : 0;
            videoEl.play().catch(() => { });
        } else {
            // Fallback for non-HLS (MP4 direct) if supported
            videoEl.currentTime = bestMatch ? bestMatch.start : 0;
            videoEl.play().catch(() => { });
        }
    }, [hlsUrl, bestMatch]);

    const handleMouseLeave = useCallback(() => {
        const videoEl = videoRef.current;
        if (!videoEl) return;

        // Hide video, show thumbnail
        videoEl.style.opacity = '0';
        videoEl.pause();
        videoEl.removeAttribute('src'); // Stop buffering
        videoEl.load();

        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
    }, []);

    const isAnnotated = status === 'ready' || status === 'needs_review';

    const handleCardClick = () => {
        if (isAnnotated) {
            // Open annotation page in new tab
            window.open(`/${encodeURIComponent(indexName)}/${encodeURIComponent(filename)}`, '_blank');
        } else if (status !== 'processing') {
            onToggleSelect(video.id);
        }
    };

    return (
        <div
            onClick={handleCardClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`
                group relative rounded-2xl bg-[var(--surface)] border-2 overflow-hidden shadow-card card-lift cursor-pointer transition-all duration-150
                ${isAnnotated
                    ? 'border-green-500/40 hover:border-green-500/60'
                    : isSelected
                        ? 'border-primary-500 ring-2 ring-primary-400/30'
                        : matches
                            ? 'border-indigo-500/50 hover:border-indigo-500/70 ring-1 ring-indigo-500/20'
                            : 'border-[var(--border)] hover:border-[var(--text-tertiary)]'}
            `}
        >
            {/* Hover glow */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] gradient-bg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10" />

            {/* Selection check — hidden for annotated videos */}
            {!isAnnotated && (
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
            )}

            {/* Status indicator */}
            {status && (
                <div className="absolute top-3 right-3 z-20">
                    <StatusIndicator status={status} />
                </div>
            )}

            {/* Semantic Match Badge */}
            {bestMatch && (
                <div className="absolute top-3 left-3 z-20 flex flex-col gap-1 items-start animate-fade-in-up">
                    <div className="px-2 py-1 bg-indigo-500/90 text-white text-xs font-bold rounded-lg shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
                        <Sparkles className="w-3 h-3 text-yellow-300" />
                        <span>Match found at {formatDuration(bestMatch.start)}</span>
                    </div>
                    {matchCount > 1 && (
                        <div className="px-2 py-0.5 bg-black/60 text-white text-[10px] font-medium rounded-md backdrop-blur-sm">
                            +{matchCount - 1} more segments
                        </div>
                    )}
                </div>
            )}

            {/* Thumbnail + hover video */}
            <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                {/* Thumbnail (always behind) */}
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={filename}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
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

                {/* View Annotation link */}
                {status && (
                    status === 'processing' ? (
                        <div className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-medium bg-gray-500/10 text-gray-400 cursor-not-allowed">
                            <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
                            Processing…
                        </div>
                    ) : (
                        <Link
                            href={`/${encodeURIComponent(indexName)}/${encodeURIComponent(filename)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-medium bg-primary-500/10 text-primary-500 hover:bg-primary-500/20 transition-colors"
                        >
                            <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
                            View Annotation
                        </Link>
                    )
                )}
            </div>
        </div>
    );
}

export default function VideoList({ videos, indexName, search, onSearchChange, selectedIds, onToggleSelect, videoStatuses = {}, searchResults = null }) {
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return videos;

        // Semantic Search Filter
        if (searchResults) {
            const resultIds = new Set(searchResults.map(r => r.id));
            // Filter logic: Only include videos present in search results
            return videos.filter(v => resultIds.has(v.id));

            // TODO: Sort by search result order (rank/score)
            // But search results are already sorted by rank usually?
            // Since we iterate `videos` (which is chronological usually), we might lose sort order.
            // Better: map searchResults to video objects.

            /*
            const videoMap = new Map(videos.map(v => [v.id, v]));
            const sorted = [];
            searchResults.forEach(r => {
                const v = videoMap.get(r.id);
                if (v) sorted.push(v);
            });
            return sorted;
            
            Let's stick to simple filter for safely first, but sorting is better UX.
            */
        }

        // Fallback: Local Filename Search
        return videos.filter((v) => {
            const sys = v.systemMetadata || {};
            const haystack = [sys.filename || ''].join(' ').toLowerCase();
            return haystack.includes(q);
        });
    }, [videos, search, searchResults]);

    // Construct map of matches for VideoCard
    const matchesMap = useMemo(() => {
        if (!searchResults) return {};
        const map = {};
        searchResults.forEach(r => map[r.id] = r.clips);
        return map;
    }, [searchResults]);

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
            {/* Results count */}
            {search && (
                <p className="text-xs text-[var(--text-secondary)] mb-4 flex items-center gap-2">
                    {searchResults ? (
                        <>
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Found {filtered.length} relevant results</span>
                        </>
                    ) : (
                        <span>Showing {filtered.length} of {videos.length} video{videos.length !== 1 ? 's' : ''}</span>
                    )}
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
                        status={videoStatuses[video.id]}
                        indexName={indexName}
                        matches={matchesMap[video.id]}
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
