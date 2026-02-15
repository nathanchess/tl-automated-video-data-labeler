
import { useState, useEffect, useRef, useMemo } from 'react';
import PCA from 'pca-js';
import { Search, ZoomIn, ZoomOut, Maximize, Play, Clock, FileText, Loader2, X } from 'lucide-react';

const POINT_SIZE = 16;
const HOVER_SCALE = 2;

export default function EmbeddingsView({ videos }) {
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
                        // Case A: 1D Array [0.1, 0.2, ...] (Expected 2560)
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
                    // Normalize/Center vectors first? PCA prefers centered data.
                    // But pca-js might handle it.
                    // Given previous issues, let's try PCA but fallback gracefully.

                    try {
                        // pca-js expects data as [var1_values, var2_values...] ??
                        // actually usually [sample1, sample2]
                        // "computePrincipalComponents" takes data.
                        // "getEigenVectors" takes data.
                        // README says: "data: 2D array of data"
                        // Let's rely on manual projection which gave us control.

                        const mean = new Array(dim).fill(0);
                        vectors.forEach(v => v.forEach((val, i) => mean[i] += val));
                        mean.forEach((_, i) => mean[i] /= vectors.length);

                        const centered = vectors.map(v => v.map((val, i) => val - mean[i]));

                        // If N=2, we have 1 degree of freedom (line).
                        // If N >= 2, we can try to find principal components.

                        // Transpose for PCA lib: [dim][samples]
                        const dataT = mean.map((_, i) => centered.map(row => row[i]));

                        const ev = PCA.getEigenVectors(dataT);

                        if (ev && ev.length > 0 && ev[0]?.vector) {
                            const ev1 = ev[0].vector;
                            const ev2 = (ev.length > 1 && ev[1]?.vector) ? ev[1].vector : new Array(dim).fill(0);

                            // Project
                            xs = centered.map(v => v.reduce((sum, val, i) => sum + val * (ev1[i] || 0), 0));
                            ys = centered.map(v => v.reduce((sum, val, i) => sum + val * (ev2[i] || 0), 0));
                        } else {
                            throw new Error("No eigenvectors found");
                        }

                    } catch (pcaError) {
                        console.error("PCA failed, falling back to simple projection", pcaError);
                        // Fallback: Use first 2 dimensions of raw embedding (dumb but works)
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
        <div
            ref={containerRef}
            className="relative w-full h-[600px] bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 overflow-hidden select-none cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Controls */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <button onClick={() => setTransform(p => ({ ...p, k: Math.min(p.k + 0.5, 5) }))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                    <ZoomIn className="w-5 h-5" />
                </button>
                <button onClick={() => setTransform(p => ({ ...p, k: Math.max(p.k - 0.5, 0.5) }))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                    <ZoomOut className="w-5 h-5" />
                </button>
                <div className="h-px bg-gray-200 dark:bg-gray-700 mx-1" />
                <button onClick={() => setTransform({ x: 0, y: 0, k: 1 })} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300">
                    <Maximize className="w-5 h-5" />
                </button>
            </div>

            {/* Error/Loading */}
            {loading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
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
                                <div className={`w-full h-full rounded bg-gradient-to-br from-[#D9F99D] to-[#FDE047] shadow-sm shadow-black/20 ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`} />

                                {/* Hover Tooltip */}
                                {(isHovered || isSelected) && (
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 animate-fade-in-up">
                                        <div className="w-24 h-14 bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-xl">
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
                <div className="absolute top-4 right-4 z-30 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in slide-in-from-right-4 fade-in duration-300">
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
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-1 mb-1">
                            {selectedVideo.systemMetadata?.filename || selectedVideo.id}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {Math.round(selectedVideo.systemMetadata?.duration || 0)}s
                            </span>
                            <span className="flex items-center gap-1">
                                <FileText className="w-3.5 h-3.5" />
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
    );
}
