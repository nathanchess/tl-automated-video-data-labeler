
import { useState, useEffect, useRef, useMemo } from 'react';
import {
    SearchIcon,
    ExpandIcon,
    CollapseIcon,
    FullScreenIcon,
    PlayIcon,
    HistoryIcon,
    TextIcon,
    SpinnerIcon,
    CloseIcon,
    CanvasIcon,
    MarengoIcon,
} from '@twelvelabs-io/react';

const POINT_SIZE = 16;
const HOVER_SCALE = 2;

export default function EmbeddingsView({ videos, isFetchingEmbeddings = false }) {
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [hoveredVideo, setHoveredVideo] = useState(null);
    const [error, setError] = useState(null);

    const containerRef = useRef(null);

    // Compute PCA and project points
    useEffect(() => {
        if (!videos || videos.length === 0) {
            setLoading(false);
            return;
        }

        const processEmbeddings = async () => {
            try {
                // 1. Extract and Validate Embeddings
                const vectors = [];
                const validVideos = [];
                let dim = 0;

                videos.forEach(v => {
                    if (!v.embeddings) return;

                    let vec = null;
                    if (Array.isArray(v.embeddings) && v.embeddings.length > 0) {
                        // Case A: 1D Array [0.1, 0.2, ...] (Expected 512)
                        if (typeof v.embeddings[0] === 'number') {
                            vec = v.embeddings;
                        }
                        // Case B: Segment Array [[0.1...], [0.2...]] (Legacy/Fallback)
                        else if (Array.isArray(v.embeddings[0])) {
                            // Average segments
                            const segs = v.embeddings;
                            const d = segs[0].length;
                            const avg = new Array(d).fill(0);
                            segs.forEach(s => s.forEach((val, i) => avg[i] += val));
                            vec = avg.map(x => x / segs.length);
                        }
                    }

                    if (vec) {
                        if (dim === 0) dim = vec.length;
                        if (vec.length === dim) {
                            vectors.push(vec);
                            validVideos.push(v);
                        }
                    }
                });

                if (vectors.length === 0) {
                    setLoading(false);
                    return;
                }

                let xs = [];
                let ys = [];

                // 2. Dimensionality Reduction
                if (vectors.length === 1) {
                    // Single point -> Center
                    xs = [0.5];
                    ys = [0.5];
                } else {
                    // Lightweight PCA via sample-space gram matrix (N×N) instead of
                    // feature-space covariance (dim×dim). This avoids O(dim^3) which
                    // freezes the browser for 512-dim Marengo embeddings.

                    console.log(`[Embeddings] Starting PCA: ${vectors.length} vectors × ${dim} dims`);
                    const t0 = performance.now();

                    try {
                        // 1. Center the data
                        const mean = new Array(dim).fill(0);
                        vectors.forEach(v => v.forEach((val, i) => mean[i] += val));
                        mean.forEach((_, i) => mean[i] /= vectors.length);
                        const centered = vectors.map(v => v.map((val, i) => val - mean[i]));

                        const N = centered.length;

                        // 2. Build N×N gram matrix (K = Close · Close^T) — much smaller than dim×dim
                        console.log(`[Embeddings] Building ${N}x${N} gram matrix...`);
                        const K = Array.from({ length: N }, () => new Array(N).fill(0));
                        for (let i = 0; i < N; i++) {
                            for (let j = i; j < N; j++) {
                                let dot = 0;
                                for (let d = 0; d < dim; d++) dot += centered[i][d] * centered[j][d];
                                K[i][j] = dot;
                                K[j][i] = dot;
                            }
                        }

                        // 3. Power iteration to find top 2 eigenvectors of gram matrix
                        const powerIteration = (mat, size, deflateVec) => {
                            let v = Array.from({ length: size }, () => Math.random() - 0.5);
                            // Normalize
                            let norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
                            v = v.map(x => x / norm);

                            for (let iter = 0; iter < 100; iter++) {
                                // Multiply: w = mat * v
                                let w = new Array(size).fill(0);
                                for (let i = 0; i < size; i++) {
                                    for (let j = 0; j < size; j++) w[i] += mat[i][j] * v[j];
                                }
                                // Deflate against previous eigenvector if provided
                                if (deflateVec) {
                                    const proj = w.reduce((s, x, i) => s + x * deflateVec[i], 0);
                                    w = w.map((x, i) => x - proj * deflateVec[i]);
                                }
                                norm = Math.sqrt(w.reduce((s, x) => s + x * x, 0));
                                if (norm < 1e-10) break;
                                v = w.map(x => x / norm);
                            }
                            return v;
                        };

                        console.log(`[Embeddings] Running power iteration...`);
                        const alpha1 = powerIteration(K, N, null);
                        const alpha2 = powerIteration(K, N, alpha1);

                        // 4. Project: xs[i] = alpha1[i], ys[i] = alpha2[i]
                        // The gram-matrix eigenvectors directly give the projections (up to scale)
                        xs = alpha1;
                        ys = alpha2;

                        const elapsed = (performance.now() - t0).toFixed(1);
                        console.log(`[Embeddings] PCA complete in ${elapsed}ms`);

                    } catch (pcaError) {
                        console.error("[Embeddings] PCA failed, falling back to raw dimensions", pcaError);
                        xs = vectors.map(v => v[0]);
                        ys = vectors.map(v => v[1] || 0);
                    }
                }

                // 3. Normalize to 0-1
                let minX = Math.min(...xs), maxX = Math.max(...xs);
                let minY = Math.min(...ys), maxY = Math.max(...ys);

                // Padding to avoid edge clamping
                if (maxX === minX) { maxX += 1e-6; minX -= 1e-6; }
                if (maxY === minY) { maxY += 1e-6; minY -= 1e-6; }

                const normalize = (val, min, max) => (val - min) / (max - min);

                const finalPoints = validVideos.map((v, i) => ({
                    id: v.id,
                    x: normalize(xs[i], minX, maxX),
                    y: normalize(ys[i], minY, maxY),
                    video: v
                }));

                setPoints(finalPoints);
                setLoading(false);

            } catch (err) {
                console.error("Embedding processing error:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        // Defer to avoid UI block
        const timer = setTimeout(processEmbeddings, 50);
        return () => clearTimeout(timer);
    }, [videos]);

    // Zoom/Pan
    const handleWheel = (e) => {
        // We'll use a safer ref-based listener if needed, but for now simple prop
        // user had passive errors. 
        // We will move this to useEffect to be safe, like the last fix.
    };

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const onWheel = (e) => {
            e.preventDefault();
            setTransform(p => ({
                ...p,
                k: Math.min(Math.max(0.5, p.k + e.deltaY * -0.001), 5)
            }));
        };
        el.addEventListener('wheel', onWheel, { passive: false });
        return () => el.removeEventListener('wheel', onWheel);
    }, []);

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setTransform(p => ({
            ...p,
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        }));
    };

    const handleMouseUp = () => setIsDragging(false);

    // Render constants
    const padding = 60; // Internal padding in pixels

    return (
        <div className="flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
            {/* Subheaders */}
            <div className="mb-5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-xl bg-tl-master-brand-green/10">
                        <CanvasIcon className="w-5 h-5 text-tl-master-brand-green" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-foreground-body">
                            Embedding Cluster Visualization
                        </h2>
                        <p className="text-sm text-foreground-secondary">
                            Visualize how your annotated videos cluster in semantic space
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground-subtle ml-[52px]">
                    <MarengoIcon className="w-3.5 h-3.5" />
                    <span>
                        Marengo video embeddings projected to 2D via <strong className="text-foreground-secondary">Principal Component Analysis (PCA)</strong> — similar videos appear closer together
                    </span>
                </div>
            </div>

            {/* Canvas */}
            <div
                ref={containerRef}
                className="relative w-full flex-1 rounded-2xl border border-dashed border-border-secondary dark:border-border-secondary overflow-hidden select-none cursor-move"
                style={{
                    backgroundColor: 'var(--tl-surface-white)',
                    backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.25) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                {/* Controls */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-surface-white p-1.5 rounded-xl shadow-lg border border-border-secondary dark:border-border-secondary">
                    <button onClick={() => setTransform(p => ({ ...p, k: Math.min(p.k + 0.5, 5) }))} className="p-2 hover:bg-surface-card rounded-lg text-gray-600 dark:text-gray-300">
                        <ExpandIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => setTransform(p => ({ ...p, k: Math.max(p.k - 0.5, 0.5) }))} className="p-2 hover:bg-surface-card rounded-lg text-gray-600 dark:text-gray-300">
                        <CollapseIcon className="w-5 h-5" />
                    </button>
                    <div className="h-px bg-gray-200 dark:bg-gray-700 mx-1" />
                    <button onClick={() => setTransform({ x: 0, y: 0, k: 1 })} className="p-2 hover:bg-surface-card rounded-lg text-gray-600 dark:text-gray-300">
                        <FullScreenIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Error/Loading */}
                {(loading || isFetchingEmbeddings) && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-white/50 dark:bg-black/50 backdrop-blur-sm px-6 text-center">
                        <SpinnerIcon className="w-8 h-8 animate-spin text-tl-master-brand-green" />
                        {isFetchingEmbeddings && (
                            <p className="text-xs text-foreground-secondary max-w-sm">
                                Fetching Marengo embeddings from TwelveLabs (one request per video). This only runs when you open this tab.
                            </p>
                        )}
                    </div>
                )}
                {error && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center text-red-500 bg-red-50/80 dark:bg-red-900/20 p-4 text-center">
                        Error visualizing embeddings: {error}
                    </div>
                )}

                {/* Canvas Layers */}
                {!loading && points.length > 0 && (
                    <div
                        className="w-full h-full origin-center transition-transform duration-75 ease-out"
                        style={{ transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.k})` }}
                    >
                        {points.map(pt => {
                            // Map 0-1 to pixel coordinates with padding
                            const w = containerRef.current?.clientWidth || 800;
                            const h = containerRef.current?.clientHeight || 600;

                            const px = padding + pt.x * (w - padding * 2);
                            const py = padding + pt.y * (h - padding * 2);

                            const isSelected = selectedVideo?.id === pt.id;
                            const isHovered = hoveredVideo?.id === pt.id;

                            return (
                                <div
                                    key={pt.id}
                                    className="absolute flex items-center justify-center transition-all duration-300 ease-spring"
                                    style={{
                                        left: px,
                                        top: py,
                                        width: POINT_SIZE,
                                        height: POINT_SIZE,
                                        transform: `translate(-50%, -50%) scale(${isSelected || isHovered ? HOVER_SCALE : 1})`,
                                        zIndex: isSelected || isHovered ? 50 : 10
                                    }}
                                    onMouseEnter={() => setHoveredVideo(pt.video)}
                                    onMouseLeave={() => setHoveredVideo(null)}
                                    onClick={(e) => { e.stopPropagation(); setSelectedVideo(pt.video); }}
                                >
                                    <div className={`w-full h-full rounded bg-gradient-to-br from-tl-master-brand-green to-tl-master-brand-orange shadow-sm shadow-black/20 ${isSelected ? 'ring-2 ring-tl-master-brand-green ring-offset-2' : ''}`} />

                                    {/* Hover Tooltip */}
                                    {(isHovered || isSelected) && (
                                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 animate-fade-in-up">
                                            <div className="w-24 h-14 bg-gray-900 rounded-lg overflow-hidden border border-border-secondary shadow-xl">
                                                <video
                                                    src={pt.video.hls?.video_url || pt.video.video_url}
                                                    className="w-full h-full object-cover"
                                                    muted
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Empty State */}
                {!loading && points.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        No embeddings available to visualize.
                    </div>
                )}

                {/* Preview Card */}
                {selectedVideo && (
                    <div className="absolute top-4 right-4 z-30 w-80 bg-surface-white rounded-2xl shadow-2xl border border-border-secondary dark:border-border-secondary overflow-hidden animate-in slide-in-from-right-4 fade-in duration-300">
                        <div className="relative aspect-video bg-black group">
                            <video
                                src={selectedVideo.hls?.video_url || selectedVideo.video_url}
                                controls
                                autoPlay
                                className="w-full h-full"
                            />
                            <button
                                onClick={() => setSelectedVideo(null)}
                                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                            >
                                <CloseIcon className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-4">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 mb-1">
                                {selectedVideo.systemMetadata?.filename || selectedVideo.id}
                            </h3>
                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                                <span className="flex items-center gap-1">
                                    <HistoryIcon className="w-3.5 h-3.5" />
                                    {Math.round(selectedVideo.systemMetadata?.duration || 0)}s
                                </span>
                                <span className="flex items-center gap-1">
                                    <TextIcon className="w-3.5 h-3.5" />
                                    {((selectedVideo.systemMetadata?.size || 0) / 1024 / 1024).toFixed(1)} MB
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                                {selectedVideo.user_metadata?.description || "No description available."}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
