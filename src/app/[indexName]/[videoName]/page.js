'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeftIcon,
    SpinnerIcon,
    HistoryIcon,
    VisionIcon,
    EntityIcon,
    AnalyzeIcon,
    ScalableIcon,
    PlayIcon,
} from '@twelvelabs-io/react';
import Sidebar from '@/components/dashboard/Sidebar';
import AnnotationEditor from '@/components/dashboard/AnnotationEditor';
import Hls from 'hls.js';

/** Parse MM:SS or HH:MM:SS → seconds (same rules as in-component historical helper) */
function parseTimestampSeconds(ts) {
    if (ts == null || ts === '') return 0;
    const parts = String(ts).trim().split(':').map(Number);
    if (parts.some((n) => Number.isNaN(n))) return 0;
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
}

function deriveAnnotationBounds(ann) {
    let start = parseTimestampSeconds(ann.start_timestamp || ann.timestamp);
    let end = parseTimestampSeconds(ann.end_timestamp || ann.timestamp);
    if (!start && !end) {
        const allChildren = [...(ann.detected_objects || []), ...(ann.detected_actions || [])];
        if (allChildren.length > 0) {
            const starts = allChildren.map((c) => parseTimestampSeconds(c.start_timestamp)).filter((t) => !Number.isNaN(t));
            const ends = allChildren.map((c) => parseTimestampSeconds(c.end_timestamp)).filter((t) => !Number.isNaN(t));
            if (starts.length) start = Math.min(...starts);
            if (ends.length) end = Math.max(...ends);
        }
    }
    end = Math.max(end, start + 0.5);
    return { start, end };
}

/**
 * Scene bars on the scrubber: one bar per annotation using its scene bounds only.
 * (We do not "tile" to the next scene's start — that contiguous logic collapsed to ~0 width
 * when adjacent rows shared the same start time or overlapped, hiding whole segments.)
 */
function computeSceneBarSpans(annotations, durationSec) {
    if (!annotations?.length || !durationSec || durationSec <= 0) return [];
    return annotations
        .map((ann, index) => {
            const { start, end } = deriveAnnotationBounds(ann);
            const displayStart = Math.max(0, Math.min(start, durationSec));
            const displayEnd = Math.max(displayStart + 0.5, Math.min(end, durationSec));
            return { annotationIndex: index, displayStart, displayEnd };
        })
        .filter((s) => s.displayEnd > s.displayStart);
}

/** Resolve playback URL from annotation / session payloads (snake or camel case). */
function resolvePlaybackUrl(data) {
    if (!data) return null;
    return (
        data.hls?.video_url ||
        data.hls?.videoUrl ||
        data.video_url ||
        data.videoUrl ||
        null
    );
}

export default function VideoAnnotationPage({ params }) {
    const { indexName, videoName } = use(params);
    const decodedIndex = decodeURIComponent(indexName);
    const decodedVideo = decodeURIComponent(videoName);
    const router = useRouter();

    const [annotationData, setAnnotationData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [videoUrl, setVideoUrl] = useState(null);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [hoverTime, setHoverTime] = useState(null);
    const [selectedAnnotationIndex, setSelectedAnnotationIndex] = useState(null);
    const [mediaReady, setMediaReady] = useState(false);

    const videoRef = useRef(null);
    const hlsRef = useRef(null);

    // Load annotation data + playback URL (localStorage, then session handoff from list)
    useEffect(() => {
        const storageKey = `annotations_${decodedIndex}_${decodedVideo}`;
        const playbackKey = `video_playback_${decodedIndex}_${decodedVideo}`;
        let url = null;
        let durationSec = 0;

        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                setAnnotationData(data);
                url = resolvePlaybackUrl(data);
                durationSec = data.systemMetadata?.duration || 0;
            }
        } catch (e) {
            console.error('Failed to load annotations:', e);
        }

        if (!url) {
            try {
                const handoff = localStorage.getItem(playbackKey);
                if (handoff) {
                    const data = JSON.parse(handoff);
                    url = resolvePlaybackUrl(data) || data.url || null;
                    if (!durationSec && data.duration) durationSec = data.duration;
                }
            } catch (e) {
                console.warn('Failed to read playback handoff:', e);
            }
        }

        if (url) {
            setVideoUrl(url);
            // Backfill missing hls on stored annotations so later visits still play.
            try {
                const stored = localStorage.getItem(storageKey);
                if (stored) {
                    const data = JSON.parse(stored);
                    if (!resolvePlaybackUrl(data)) {
                        localStorage.setItem(
                            storageKey,
                            JSON.stringify({
                                ...data,
                                hls: data.hls || { video_url: url },
                                video_url: url,
                            }),
                        );
                    }
                }
            } catch {
                /* ignore */
            }
        }
        if (durationSec) setDuration(durationSec);
        setLoading(false);
    }, [decodedIndex, decodedVideo]);

    // Initialize HLS once the <video> element is mounted
    useEffect(() => {
        if (!videoUrl || loading) return;

        let cancelled = false;
        let rafId = 0;

        const attach = () => {
            const video = videoRef.current;
            if (!video) {
                rafId = requestAnimationFrame(attach);
                return;
            }
            if (cancelled) return;

            setMediaReady(false);

            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }

            if (Hls.isSupported()) {
                const hls = new Hls({
                    enableWorker: false,
                    lowLatencyMode: false,
                });

                hls.loadSource(videoUrl);
                hls.attachMedia(video);
                hlsRef.current = hls;

                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    if (!cancelled) setMediaReady(true);
                });
                hls.on(Hls.Events.ERROR, (_event, data) => {
                    if (!data?.fatal || cancelled) return;
                    console.error('HLS error:', data);
                    // Last-resort: try native src (some environments recover)
                    if (video.canPlayType('application/vnd.apple.mpegurl')) {
                        video.src = videoUrl;
                        setMediaReady(true);
                    }
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = videoUrl;
                setMediaReady(true);
            } else {
                video.src = videoUrl;
                setMediaReady(true);
            }
        };

        attach();

        return () => {
            cancelled = true;
            if (rafId) cancelAnimationFrame(rafId);
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [videoUrl, loading]);

    const handleSeek = (timeInSeconds) => {
        if (videoRef.current) {
            videoRef.current.currentTime = timeInSeconds;
            // Optionally auto-play on seek
            videoRef.current.play().catch(() => { });
            setIsPlaying(true);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current && !duration) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSaveAnnotation = (updatedAnnotation) => {
        if (selectedAnnotationIndex === null || !annotationData) return;

        const newAnnotations = [...annotationData.annotations];

        // Update the specific annotation and force high confidence
        newAnnotations[selectedAnnotationIndex] = {
            ...updatedAnnotation,
            confidence_score: 1.0 // Manual override = 100% confidence
        };

        // Recalculate overall confidence
        const scores = newAnnotations.map(a => a.confidence_score ?? a.overall_confidence).filter(s => s != null);
        const newOverallConfidence = scores.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : 0;

        const updatedData = {
            ...annotationData,
            annotations: newAnnotations,
            overall_confidence: newOverallConfidence
        };

        setAnnotationData(updatedData);

        // Persist to local storage
        try {
            const storageKey = `annotations_${decodedIndex}_${decodedVideo}`;
            localStorage.setItem(storageKey, JSON.stringify(updatedData));
        } catch (e) {
            console.error('Failed to save annotation:', e);
        }
    };

    const handleDeleteAnnotation = () => {
        if (selectedAnnotationIndex === null || !annotationData) return;

        const newAnnotations = annotationData.annotations.filter((_, i) => i !== selectedAnnotationIndex);

        // Recalculate overall confidence
        const scores = newAnnotations.map(a => a.confidence_score ?? a.overall_confidence).filter(s => s != null);
        const newOverallConfidence = scores.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : 0;

        const updatedData = {
            ...annotationData,
            annotations: newAnnotations,
            overall_confidence: newOverallConfidence
        };

        setAnnotationData(updatedData);
        setSelectedAnnotationIndex(null); // Deselect after delete

        // Persist to local storage
        try {
            const storageKey = `annotations_${decodedIndex}_${decodedVideo}`;
            localStorage.setItem(storageKey, JSON.stringify(updatedData));
        } catch (e) {
            console.error('Failed to delete annotation:', e);
        }
    };

    const parseTimestamp = parseTimestampSeconds;

    return (
        <div className="flex min-h-screen">
            <Sidebar />

            <main className="flex-1 lg:ml-60 p-4 lg:p-6 pb-20">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push(`/${encodeURIComponent(decodedIndex)}`)}
                        className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground-body transition-colors mb-4 cursor-pointer"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to {decodedIndex}
                    </button>

                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground-body break-all">
                                {decodedVideo}
                            </h1>
                            <p className="text-sm text-foreground-secondary mt-1">
                                Annotation results & video playback
                            </p>
                        </div>
                        {annotationData?.annotatedAt && (
                            <div className="flex items-center gap-2 text-xs text-foreground-subtle bg-surface-white px-3 py-1.5 rounded-lg border border-border-secondary">
                                <HistoryIcon className="w-3.5 h-3.5" />
                                <span suppressHydrationWarning>Annotated {new Date(annotationData.annotatedAt).toLocaleString()}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <SpinnerIcon className="w-8 h-8 text-foreground-subtle animate-spin" />
                    </div>
                )}

                {!loading && !annotationData && (
                    <div className="rounded-2xl border border-border-secondary bg-surface-white p-12 text-center max-w-lg mx-auto mt-10">
                        <VisionIcon className="w-12 h-12 text-foreground-subtle mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground-body mb-2">
                            No annotations found
                        </h3>
                        <p className="text-sm text-foreground-secondary mb-6">
                            This video hasn't been annotated securely yet or the data is missing.
                        </p>
                        <button
                            onClick={() => router.push(`/${encodeURIComponent(decodedIndex)}`)}
                            className="px-4 py-2 bg-tl-master-brand-green text-white rounded-lg text-sm font-medium hover:bg-tl-master-brand-dark-green transition-colors"
                        >
                            Go back to list
                        </button>
                    </div>
                )}

                {!loading && annotationData && (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                        {/* LEFT COLUMN: Player & Timeline */}
                        <div className="xl:col-span-2 space-y-4">
                            <div className="relative aspect-video overflow-hidden rounded-2xl border border-border-secondary bg-black shadow-lg">
                                {videoUrl ? (
                                    <>
                                        <video
                                            ref={videoRef}
                                            className="h-full w-full object-contain"
                                            controls
                                            playsInline
                                            preload="auto"
                                            onTimeUpdate={handleTimeUpdate}
                                            onLoadedMetadata={handleLoadedMetadata}
                                            onPlay={() => setIsPlaying(true)}
                                            onPause={() => setIsPlaying(false)}
                                        />
                                        {!mediaReady && (
                                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50">
                                                <SpinnerIcon className="size-8 animate-spin text-white/80" />
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-foreground-subtle">
                                        <PlayIcon className="mb-2 size-12 opacity-50" />
                                        <p className="text-sm">Video URL not available in stored data</p>
                                        <p className="mt-1 text-xs opacity-70">Try re-annotating this video</p>
                                    </div>
                                )}
                            </div>

                            {/* Detailed Interactive Timeline */}
                            <div
                                className="relative h-24 w-full bg-surface-card rounded-lg border border-border-secondary select-none cursor-crosshair group overflow-hidden"
                                onMouseMove={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const percent = Math.max(0, Math.min(1, x / rect.width));
                                    setHoverTime(percent * (duration || 1));
                                }}
                                onMouseLeave={() => setHoverTime(null)}
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const percent = x / rect.width;
                                    handleSeek(percent * (duration || 1));
                                }}
                            >
                                {/* Hover Indicator */}
                                {hoverTime !== null && (
                                    <div
                                        className="absolute top-0 bottom-0 w-px bg-red-500 z-50 pointer-events-none"
                                        style={{ left: `${(hoverTime / (duration || 1)) * 100}%` }}
                                    >
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-tl-mono">
                                            {formatTime(hoverTime)}
                                        </div>
                                    </div>
                                )}

                                {/* Grid lines (every 5 seconds) */}
                                <div className="absolute inset-0 pointer-events-none opacity-10">
                                    {Array.from({ length: Math.ceil((duration || 1) / 5) }).map((_, i) => (
                                        <div key={i} className="absolute top-0 bottom-0 border-l border-border-secondary" style={{ left: `${(i * 5 / (duration || 1)) * 100}%` }} />
                                    ))}
                                </div>

                                {/* LAYER 1: Background Scene/Summary Segments (one bar per scene bounds) */}
                                <div className="absolute top-0 bottom-0 left-0 right-0">
                                    {computeSceneBarSpans(annotationData.annotations, duration).map((span) => {
                                        const i = span.annotationIndex;
                                        const ann = annotationData.annotations[i];
                                        if (!ann) return null;
                                        const { displayStart: start, displayEnd: end } = span;
                                        const durationSeconds = Math.max(0.5, end - start);
                                        const leftPercent = (start / (duration || 1)) * 100;
                                        const widthPercent = (durationSeconds / (duration || 1)) * 100;

                                        if (leftPercent > 100) return null;

                                        const color = generateRandomPastelColor(i + (ann.description?.length || 0));

                                        return (
                                            <div
                                                key={`bg-${i}`}
                                                className="absolute top-0 bottom-0 opacity-20 hover:opacity-40 transition-opacity border-r border-white/20"
                                                style={{
                                                    left: `${leftPercent}%`,
                                                    width: `${widthPercent}%`,
                                                    backgroundColor: color
                                                }}
                                                title={`Scene: ${ann.description?.slice(0, 100)}...`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSeek(start);
                                                    setSelectedAnnotationIndex(i);
                                                }}
                                            />
                                        );
                                    })}
                                </div>

                                {/* LAYER 2: Foreground Object/Action Markers */}
                                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-10">
                                    {(() => {
                                        // Flatten all objects and actions into a single array of items to render
                                        const allItems = [];
                                        annotationData.annotations?.forEach((ann, index) => {
                                            // Objects (key: object)
                                            ann.detected_objects?.forEach(obj => {
                                                allItems.push({
                                                    label: obj.object || obj.label || obj.name,
                                                    type: 'object',
                                                    start: parseTimestamp(obj.start_timestamp),
                                                    end: parseTimestamp(obj.end_timestamp),
                                                    confidence: obj.confidence_score,
                                                    annotationIndex: index
                                                });
                                            });
                                            // Actions (key: action)
                                            ann.detected_actions?.forEach(act => {
                                                allItems.push({
                                                    label: act.action || act.label || act.name,
                                                    type: 'action',
                                                    start: parseTimestamp(act.start_timestamp),
                                                    end: parseTimestamp(act.end_timestamp),
                                                    confidence: act.confidence_score,
                                                    annotationIndex: index
                                                });
                                            });
                                        });

                                        // Lane Allocation for De-clustering
                                        allItems.sort((a, b) => a.start - b.start);
                                        const lanes = []; // Stores the end time of the last item in each lane
                                        const LANE_HEIGHT = 12; // px per lane

                                        return allItems.map((item, i) => {
                                            const itemDur = Math.max(1, item.end - item.start);
                                            const left = (item.start / (duration || 1)) * 100;
                                            const width = (itemDur / (duration || 1)) * 100;

                                            if (left > 100) return null;

                                            // Compatible color based on label text
                                            const itemColor = stringToColor(item.label);
                                            const isObject = item.type === 'object';

                                            // Find the first available lane where this item fits
                                            let laneIndex = 0;
                                            while (true) {
                                                // Add a small buffer (0.5s) to ensure visual separation
                                                if (!lanes[laneIndex] || item.start >= (lanes[laneIndex] + 0.5)) {
                                                    lanes[laneIndex] = item.end;
                                                    break;
                                                }
                                                laneIndex++;
                                                // Safety break to prevent infinite loops (max 10 lanes)
                                                if (laneIndex > 10) {
                                                    laneIndex = 0; // Fallback to overlap if crowded
                                                    break;
                                                }
                                            }

                                            const topOffset = laneIndex * LANE_HEIGHT;

                                            return (
                                                <div
                                                    key={`mk-${i}`}
                                                    className={`
                                                        absolute h-2.5 rounded-full shadow-sm cursor-pointer hover:scale-125 hover:z-50 transition-all ring-1 ring-white/20
                                                        flex items-center justify-center
                                                    `}
                                                    style={{
                                                        left: `${left}%`,
                                                        width: `${Math.max(width, 0.5)}%`, // Ensure visible
                                                        minWidth: '4px',
                                                        backgroundColor: itemColor,
                                                        top: `${10 + topOffset}px`
                                                    }}
                                                    title={`${isObject ? 'Object' : 'Action'}: ${item.label} (${formatTime(item.start)} - ${formatTime(item.end)})`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSeek(item.start);
                                                        if (item.annotationIndex != null) {
                                                            setSelectedAnnotationIndex(item.annotationIndex);
                                                        }
                                                    }}
                                                />
                                            );
                                        });
                                    })()}
                                </div>
                            </div>

                            {/* Legend / Help */}
                            <div className="mt-4">
                                <div className="text-[10px] text-foreground-subtle flex flex-wrap gap-x-4 gap-y-2 mb-2">
                                    <span>Hover segments for details • Click to jump</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {(() => {
                                        // Extract unique labels
                                        const uniqueLabels = new Set();
                                        annotationData.annotations?.forEach(ann => {
                                            ann.detected_objects?.forEach(o => uniqueLabels.add(o.object || o.label || o.name));
                                            ann.detected_actions?.forEach(a => uniqueLabels.add(a.action || a.label || a.name));
                                        });
                                        return Array.from(uniqueLabels).map(label => (
                                            <div key={label} className="flex items-center gap-1.5 text-[10px] text-foreground-secondary bg-surface-white px-2 py-1 rounded border border-border-secondary">
                                                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: stringToColor(label) }} />
                                                <span className="font-medium">{label}</span>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>

                            {/* Annotation Editor (Visible when selected) */}
                            {selectedAnnotationIndex !== null && annotationData.annotations && annotationData.annotations[selectedAnnotationIndex] && (
                                <AnnotationEditor
                                    annotation={annotationData.annotations[selectedAnnotationIndex]}
                                    onSave={handleSaveAnnotation}
                                    onDelete={handleDeleteAnnotation}
                                    onClose={() => setSelectedAnnotationIndex(null)}
                                />
                            )}
                        </div>


                        {/* RIGHT COLUMN: Annotation List */}
                        <div className="xl:col-span-1">
                            <div className="sticky top-6 flex flex-col h-[calc(100vh-6rem)]">
                                <div className="mb-3 flex items-center justify-between">
                                    <h2 className="font-semibold text-foreground-body">
                                        Annotations ({annotationData.annotations?.length || 0})
                                    </h2>
                                    <span className="text-xs text-foreground-subtle">
                                        Scroll to view all
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                                    {annotationData.annotations?.map((ann, i) => {
                                        // Robust start time: parent or min of children
                                        let startSeconds = parseTimestamp(ann.start_timestamp || ann.timestamp);
                                        let endSeconds = parseTimestamp(ann.end_timestamp || ann.timestamp);

                                        if (!startSeconds && !endSeconds) {
                                            const allChildren = [...(ann.detected_objects || []), ...(ann.detected_actions || [])];
                                            if (allChildren.length > 0) {
                                                const starts = allChildren.map(c => parseTimestamp(c.start_timestamp)).filter(t => !isNaN(t));
                                                const ends = allChildren.map(c => parseTimestamp(c.end_timestamp)).filter(t => !isNaN(t));
                                                if (starts.length) startSeconds = Math.min(...starts);
                                                if (ends.length) endSeconds = Math.max(...ends);
                                            }
                                        }

                                        const isActive = currentTime >= startSeconds && currentTime <= endSeconds;

                                        // Green/White Theme when active
                                        const activeClass = isActive
                                            ? 'shadow-lg border-lime-500 bg-surface-white'
                                            : 'border-border-secondary hover:border-border-secondary bg-surface-white';

                                        return (
                                            <div
                                                key={i}
                                                onClick={() => {
                                                    handleSeek(startSeconds);
                                                    setSelectedAnnotationIndex(i);
                                                }}
                                                className={`
                                                    rounded-xl border transition-all cursor-pointer p-4 group relative overflow-hidden mb-3
                                                    ${activeClass}
                                                `}
                                            >
                                                {/* Colored strip indicator (only when active) */}
                                                {isActive && (
                                                    <div
                                                        className="absolute left-0 top-0 bottom-0 w-1.5 bg-lime-500"
                                                    />
                                                )}

                                                {/* Header */}
                                                <div className="flex items-center justify-between mb-2 pl-2">
                                                    <span className={`
                                                        px-2 py-0.5 rounded text-xs font-tl-mono font-bold
                                                        ${isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-surface-card text-foreground-secondary'}
                                                    `}>
                                                        {formatTime(startSeconds)} - {formatTime(endSeconds)}
                                                    </span>
                                                    {/* Confidence Badge (boxed) */}
                                                    {(ann.confidence_score != null || ann.overall_confidence != null) && (
                                                        <span className={`
                                                            ml-2 px-1.5 py-0.5 rounded border text-[10px] font-bold tracking-wide
                                                            ${(ann.confidence_score ?? ann.overall_confidence) >= 0.7
                                                                ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400'
                                                                : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400'}
                                                        `}>
                                                            {((ann.confidence_score ?? ann.overall_confidence) * 100).toFixed(0)}% Conf.
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="text-xs text-foreground-secondary line-clamp-3 mb-3 leading-relaxed group-hover:text-foreground-body transition-colors pl-2">
                                                    {ann.description || 'No description'}
                                                </p>

                                                <div className="flex flex-wrap gap-1.5 pl-2">
                                                    {(ann.detected_objects || []).map((obj, j) => {
                                                        const label = obj.object || obj.label || obj.name;
                                                        return (
                                                            <span
                                                                key={`obj-${j}`}
                                                                className="px-1.5 py-0.5 rounded-md text-[10px] font-medium border border-transparent shadow-sm"
                                                                style={{
                                                                    backgroundColor: stringToColor(label),
                                                                    color: '#fff',
                                                                    textShadow: '0px 1px 2px rgba(0,0,0,0.3)'
                                                                }}
                                                                title={`Object: ${label} (${obj.start_timestamp}-${obj.end_timestamp})`}
                                                            >
                                                                {label}
                                                            </span>
                                                        );
                                                    })}

                                                    {(ann.detected_actions || []).map((act, k) => {
                                                        const label = act.action || act.label || act.name;
                                                        return (
                                                            <span
                                                                key={`act-${k}`}
                                                                className="px-1.5 py-0.5 rounded-md text-[10px] font-medium border border-transparent shadow-sm"
                                                                style={{
                                                                    backgroundColor: stringToColor(label),
                                                                    color: '#fff',
                                                                    textShadow: '0px 1px 2px rgba(0,0,0,0.3)'
                                                                }}
                                                                title={`Action: ${label} (${act.start_timestamp}-${act.end_timestamp})`}
                                                            >
                                                                {label}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Raw Data Toggle */}
                                    <details className="pt-4">
                                        <summary className="text-xs text-foreground-subtle cursor-pointer hover:underline">
                                            View Raw JSON
                                        </summary>
                                        <pre className="mt-2 text-[10px] bg-surface-card p-2 rounded border border-border-secondary overflow-x-auto">
                                            {JSON.stringify(annotationData, null, 2)}
                                        </pre>
                                    </details>
                                </div>
                            </div>
                        </div>

                    </div>
                )
                }
            </main >
        </div >
    );
}

// Helper to format seconds as MM:SS
function formatTime(seconds) {
    if (!seconds) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Helper: Generate a consistent HSL color from a string (for consistent label colors)
function stringToColor(str) {
    if (!str) return '#999';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 50%)`; // Fixed saturation/lightness for vibrant, readable colors
}

// Helper: Generate random pastel color from a seed (for background segments)
function generateRandomPastelColor(seed) {
    const h = Math.floor((Math.abs(Math.sin(seed) * 16777215)) % 360);
    return `hsl(${h}, 70%, 80%)`; // High lightness for pastel background feel
}
