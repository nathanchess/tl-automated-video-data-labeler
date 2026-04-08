import { useRouter } from 'next/navigation';
import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Trash2, AlertCircle, Loader2, Check, Info } from 'lucide-react';
import { upload } from '@vercel/blob/client';

const MIN_DURATION = 4;        // seconds
const MAX_DURATION = 3600;     // 1 hour

const STATUS_MESSAGES = [
    'Uploading video content to TwelveLabs',
    'Generating index',
    'Creating embedding representation of video',
];

/** Pretty-print bytes → KB / MB / GB */
function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    return (bytes / 1073741824).toFixed(2) + ' GB';
}

/** Pretty-print seconds → 0:04 / 1:23:45 */
function formatDuration(s) {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = Math.floor(s % 60);
    if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

/** Rough indexing time range string based on total video duration.
 *  TwelveLabs indexing typically completes in ~30–40% of real-time video length.
 */
function formatIndexingEstimateRange(totalSeconds) {
    if (!totalSeconds || totalSeconds <= 0) return '';
    const low = totalSeconds * 0.3;
    const high = totalSeconds * 0.4;

    const toHuman = (s) => {
        if (s < 60) return `${Math.max(5, Math.round(s / 5) * 5)}s`;
        const mins = Math.round(s / 60);
        return `${mins} min`;
    };

    return `${toHuman(low)}–${toHuman(high)}`;
}

/** Get duration of a video File via a temporary <video> element */
function getVideoDuration(file) {
    return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src);
            resolve(video.duration);
        };
        video.onerror = () => {
            URL.revokeObjectURL(video.src);
            resolve(null);
        };
        video.src = URL.createObjectURL(file);
    });
}

/** Thumbnail tile: hover plays muted preview; hides native overlays via CSS + video attrs */
function UploadVideoPreview({ video: v, onRemove, creating }) {
    const videoRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const stopPreview = useCallback(() => {
        const el = videoRef.current;
        if (el) {
            el.pause();
            el.currentTime = 0;
        }
        setIsPlaying(false);
    }, []);

    const handleEnter = useCallback(async () => {
        setIsHovered(true);
        const el = videoRef.current;
        if (!el || creating) return;
        try {
            el.currentTime = 0;
            await el.play();
        } catch {
            setIsPlaying(false);
        }
    }, [creating]);

    const handleLeave = useCallback(() => {
        setIsHovered(false);
        stopPreview();
    }, [stopPreview]);

    return (
        <div
            className="group/vid relative rounded-xl border border-gray-100 bg-gray-50 overflow-hidden"
            onMouseEnter={handleEnter}
            onMouseLeave={handleLeave}
        >
            <div className="relative aspect-video bg-gray-200">
                <video
                    ref={videoRef}
                    src={v.thumbUrl}
                    className="upload-modal-preview-video w-full h-full object-cover select-none"
                    muted
                    loop
                    playsInline
                    preload="auto"
                    controls={false}
                    disablePictureInPicture
                    disableRemotePlayback
                    controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                />
                <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono pointer-events-none z-[1]">
                    {formatDuration(v.duration)}
                </span>
                {isHovered && isPlaying && (
                    <div className="absolute bottom-0 left-0 right-0 z-[1] flex items-center gap-1.5 py-1.5 pl-2 pr-14 bg-gradient-to-t from-black/80 via-black/50 to-transparent text-white text-[10px] font-semibold tracking-wide uppercase pointer-events-none">
                        <span className="relative flex h-2 w-2 shrink-0">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-400 opacity-60" />
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-lime-400" />
                        </span>
                        Playing preview
                    </div>
                )}
                {!creating && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove(v.id);
                        }}
                        className="absolute top-1.5 right-1.5 z-[2] p-1 rounded-full bg-black/50 text-white opacity-0 group-hover/vid:opacity-100 transition-opacity cursor-pointer hover:bg-red-600"
                        aria-label="Remove video"
                    >
                        <X className="w-3 h-3" strokeWidth={2} />
                    </button>
                )}
            </div>
            <div className="px-2.5 py-2">
                <p className="text-xs font-medium text-gray-700 truncate">{v.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-400">{formatBytes(v.size)}</span>
                    <span className="text-[10px] text-gray-400">·</span>
                    <span className="text-[10px] text-gray-400">{formatDuration(v.duration)}</span>
                </div>
            </div>
        </div>
    );
}

export default function CreateIndexModal({ open, onClose, onComplete, presetIndexName, presetDescription }) {
    const router = useRouter();
    const isPresetMode = Boolean(presetIndexName);

    // ─── Form state ───
    const [indexName, setIndexName] = useState(presetIndexName || '');
    const [indexDesc, setIndexDesc] = useState(presetDescription || '');
    const [videos, setVideos] = useState([]);          // { id, file, name, size, duration, thumbUrl }
    const [errors, setErrors] = useState([]);           // rejected-file error strings

    // ─── Progress state ───
    const [creating, setCreating] = useState(false);
    const [progress, setProgress] = useState(0);        // 0-100
    const [statusIdx, setStatusIdx] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [completed, setCompleted] = useState(0);
    const [isComplete, setIsComplete] = useState(false);
    const [showIndexingInfo, setShowIndexingInfo] = useState(false);

    const fileInputRef = useRef(null);
    const idCounter = useRef(0);
    /** Prevents double submit before React applies `creating`, and after success while the modal is still open */
    const uploadInFlightRef = useRef(false);

    // ─── Cycle status text while creating (fallback when no server message) ───
    useEffect(() => {
        if (!creating || isComplete) return;
        const interval = setInterval(() => {
            setStatusIdx((i) => (i + 1) % STATUS_MESSAGES.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [creating, isComplete]);

    // ─── Process dropped / selected files ───
    const processFiles = useCallback(async (fileList) => {
        const newErrors = [];
        const newVideos = [];

        for (const file of fileList) {
            if (!file.type.startsWith('video/')) {
                newErrors.push(`"${file.name}" is not a video file.`);
                continue;
            }

            const duration = await getVideoDuration(file);

            if (duration === null) {
                newErrors.push(`"${file.name}" could not be read.`);
                continue;
            }
            if (duration < MIN_DURATION) {
                newErrors.push(`"${file.name}" is too short (${formatDuration(duration)}). Minimum is 4 seconds.`);
                continue;
            }
            if (duration > MAX_DURATION) {
                newErrors.push(`"${file.name}" exceeds 1 hour (${formatDuration(duration)}). Maximum is 1 hour.`);
                continue;
            }

            const thumbUrl = URL.createObjectURL(file);
            idCounter.current += 1;

            newVideos.push({
                id: idCounter.current,
                file,
                name: file.name,
                size: file.size,
                duration,
                thumbUrl,
            });
        }

        if (newErrors.length) setErrors((prev) => [...prev, ...newErrors]);
        if (newVideos.length) setVideos((prev) => [...prev, ...newVideos]);
    }, []);

    // ─── Drag & drop handlers ───
    const [dragging, setDragging] = useState(false);

    const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
    const onDragLeave = () => setDragging(false);
    const onDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files.length) processFiles(Array.from(e.dataTransfer.files));
    };

    const onFileChange = (e) => {
        if (e.target.files.length) processFiles(Array.from(e.target.files));
        e.target.value = '';
    };

    // ─── Actions ───
    const clearAll = () => {
        videos.forEach((v) => URL.revokeObjectURL(v.thumbUrl));
        setVideos([]);
        setErrors([]);
    };

    const removeVideo = (id) => {
        setVideos((prev) => {
            const v = prev.find((x) => x.id === id);
            if (v) URL.revokeObjectURL(v.thumbUrl);
            return prev.filter((x) => x.id !== id);
        });
    };

    const handleCreate = async () => {
        if (uploadInFlightRef.current) return;
        uploadInFlightRef.current = true;

        setCreating(true);
        setIsComplete(false);
        setProgress(0);
        setStatusIdx(0);
        setStatusMessage('');
        setCompleted(0);

        try {
            // ── Phase 1: Upload videos to Vercel Blob ──
            const videoURLs = [];
            const totalVideos = videos.length;

            for (let i = 0; i < totalVideos; i++) {
                const v = videos[i];
                setStatusMessage(`Uploading "${v.name}" to cloud storage (${i + 1}/${totalVideos})…`);
                setProgress(Math.round(((i) / totalVideos) * 40)); // phase 1 = 0-40%

                try {
                    const blob = await upload(v.name, v.file, {
                        access: 'public',
                        handleUploadUrl: '/api/upload',
                        multipart: true,
                    });

                    videoURLs.push(blob.url);
                    console.log(`Uploaded ${v.name} → ${blob.url}`);
                } catch (uploadErr) {
                    setErrors((prev) => [...prev, `Failed to upload "${v.name}": ${uploadErr.message}`]);
                }
            }

            if (videoURLs.length === 0) {
                throw new Error('No videos were successfully uploaded to cloud storage.');
            }

            setProgress(40);
            setStatusMessage(`All files uploaded. Starting TwelveLabs processing…`);

            // ── Phase 2: Send URLs to /api/videos for TwelveLabs processing ──
            const metadata = { indexName: indexName, description: indexDesc };

            const res = await fetch('/api/videos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoURLs, metadata }),
            });

            if (!res.ok) {
                throw new Error(`Video processing failed: ${res.status}`);
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                let currentEvent = '';
                for (const line of lines) {
                    if (line.startsWith('event: ')) {
                        currentEvent = line.slice(7).trim();
                    } else if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            // Map server percent (0-100) to phase 2 range (40-100)
                            if (data.percent !== undefined) {
                                setProgress(40 + Math.round((data.percent / 100) * 60));
                            }
                            if (data.message) setStatusMessage(data.message);
                            if (data.completed !== undefined) setCompleted(data.completed);

                            if (currentEvent === 'complete') {
                                setProgress(100);
                                setStatusMessage('All videos processed successfully!');
                                setIsComplete(true);

                                // Auto-close after a brief delay and notify parent
                                setTimeout(() => {
                                    clearAll();
                                    setIndexName(presetIndexName || '');
                                    setIndexDesc(presetDescription || '');
                                    setCreating(false);
                                    setIsComplete(false);
                                    setProgress(0);
                                    onClose();
                                    if (onComplete) onComplete();
                                }, 1500);
                            }

                            if (currentEvent === 'video_error' && data.error) {
                                setErrors((prev) => [...prev, `Video ${data.index + 1}: ${data.error}`]);
                            }
                        } catch {
                            // skip malformed JSON
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Create index error:', err);
            setErrors((prev) => [...prev, err.message]);
        } finally {
            uploadInFlightRef.current = false;
        }
    };

    const handleClose = () => {
        if (creating && !isComplete) return; // prevent closing mid-creation
        clearAll();
        setIndexName(presetIndexName || '');
        setIndexDesc(presetDescription || '');
        setCreating(false);
        setIsComplete(false);
        setProgress(0);
        onClose();
    };

    if (!open) return null;

    const totalDurationSeconds = videos.reduce((sum, v) => sum + (v.duration || 0), 0);
    const estimatedIndexingRange = formatIndexingEstimateRange(totalDurationSeconds);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={handleClose} />

            {/* Modal card */}
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl flex flex-col animate-pop-in">

                {/* ─── Header ─── */}
                <div className="flex items-center justify-between px-8 pt-8 pb-2">
                    <h2 className="text-xl font-bold text-gray-900">{isPresetMode ? 'Upload Videos' : 'Create Index'}</h2>
                    <button
                        onClick={handleClose}
                        disabled={creating && !isComplete}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-40"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
                    </button>
                </div>

                {/* ─── Body ─── */}
                <div className="px-8 py-6 flex flex-col gap-7">

                    {/* 1 ─ Index Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">
                            Index Name
                        </label>
                        <p className="text-xs text-gray-400 mb-2">
                            A short, descriptive name for your video collection.
                        </p>
                        <input
                            type="text"
                            value={indexName}
                            onChange={(e) => setIndexName(e.target.value)}
                            placeholder="e.g. Autonomous Driving Q1 Batch"
                            disabled={creating || isPresetMode}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition disabled:opacity-60"
                        />
                    </div>

                    {/* 2 ─ Index Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-1">
                            Index Description
                        </label>
                        <p className="text-xs text-gray-400 mb-2">
                            Describe the purpose of this index and the types of videos it will contain.
                        </p>
                        <textarea
                            value={indexDesc}
                            onChange={(e) => setIndexDesc(e.target.value)}
                            placeholder="e.g. Dashcam footage for perception model training data…"
                            rows={3}
                            disabled={creating || isPresetMode}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition resize-none disabled:opacity-60"
                        />
                    </div>

                    {/* 3 ─ Video Batch Upload */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="text-sm font-semibold text-gray-900">
                                Video Upload
                            </label>
                            {videos.length > 0 && (
                                <span className="text-xs font-medium text-gray-500">
                                    {videos.length} video{videos.length !== 1 ? 's' : ''} selected
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-400 mb-3">
                            Upload one or more video files. Each video must be between <strong className="text-gray-500">4 seconds</strong> and <strong className="text-gray-500">1 hour</strong> long.
                        </p>

                        {/* Drop zone */}
                        <div
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            onClick={() => !creating && fileInputRef.current?.click()}
                            className={`
                                relative rounded-xl border-2 border-dashed px-6 py-10
                                flex flex-col items-center justify-center gap-2 cursor-pointer
                                transition-colors
                                ${dragging
                                    ? 'border-primary-400 bg-primary-50/40'
                                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'}
                                ${creating ? 'pointer-events-none opacity-50' : ''}
                            `}
                        >
                            <Upload className="w-8 h-8 text-gray-300" strokeWidth={1.5} />
                            <p className="text-sm text-gray-500">
                                <span className="font-medium text-gray-700">Click to browse</span> or drag & drop videos here
                            </p>
                            <p className="text-xs text-gray-400">MP4, MOV, AVI, WebM — 4 sec to 1 hour each</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="video/*"
                                multiple
                                onChange={onFileChange}
                                className="hidden"
                            />
                        </div>

                        {/* Error messages */}
                        {errors.length > 0 && (
                            <div className="mt-3 flex flex-col gap-1.5">
                                {errors.map((err, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" strokeWidth={2} />
                                        <span>{err}</span>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setErrors([])}
                                    className="self-end text-xs text-gray-400 hover:text-gray-600 transition-colors mt-1 cursor-pointer"
                                >
                                    Dismiss errors
                                </button>
                            </div>
                        )}

                        {/* Video preview grid */}
                        {videos.length > 0 && (
                            <div className="mt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-xs font-medium text-gray-500">
                                            {videos.length} video{videos.length !== 1 ? 's' : ''}
                                        </span>
                                        {estimatedIndexingRange && (
                                            <button
                                                type="button"
                                                onClick={() => setShowIndexingInfo(true)}
                                                className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer"
                                            >
                                                <Info className="w-3 h-3" strokeWidth={1.5} />
                                                <span>
                                                    Est. indexing time: ~{estimatedIndexingRange}
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        onClick={clearAll}
                                        disabled={creating}
                                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors cursor-pointer disabled:opacity-40"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                                        Clear all
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-1">
                                    {videos.map((v) => (
                                        <UploadVideoPreview
                                            key={v.id}
                                            video={v}
                                            onRemove={removeVideo}
                                            creating={creating}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Footer ─── */}
                <div className="px-8 pb-8 pt-2">
                    {/* Progress bar (visible when creating) */}
                    {creating && (
                        <div className="mb-5">
                            <div className="flex items-center gap-2 mb-2">
                                {isComplete ? (
                                    <Check className="w-4 h-4 text-green-600" strokeWidth={3} />
                                ) : (
                                    <Loader2 className="w-4 h-4 text-primary-500 animate-spin" strokeWidth={2} />
                                )}
                                <span className={`text-sm font-medium ${isComplete ? 'text-green-700' : 'text-gray-600'}`}>
                                    {statusMessage || STATUS_MESSAGES[statusIdx]}
                                </span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-500 ease-out"
                                    style={{
                                        width: `${progress}%`,
                                        background: isComplete
                                            ? '#16A34A' // green-600
                                            : 'linear-gradient(135deg, #D9F99D 0%, #FDE047 100%)',
                                    }}
                                />
                            </div>
                            <div className="mt-1.5 flex flex-col gap-0.5">
                                <p className="text-xs text-gray-400">
                                    {completed} of {videos.length} video{videos.length !== 1 ? 's' : ''} processed
                                </p>
                                {estimatedIndexingRange && (
                                    <button
                                        type="button"
                                        onClick={() => setShowIndexingInfo(true)}
                                        className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 cursor-pointer self-start"
                                    >
                                        <Info className="w-3 h-3" strokeWidth={1.5} />
                                        <span>
                                            Indexing typically finishes in ~30–40% of video duration (~{estimatedIndexingRange})
                                        </span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleCreate}
                        disabled={creating || isComplete || !indexName.trim() || videos.length === 0}
                        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer
                                   text-gray-900 hover:brightness-95
                                   disabled:opacity-40 disabled:cursor-not-allowed`}
                        style={{
                            background: isComplete
                                ? '#4ADE80' // green-400
                                : 'linear-gradient(135deg, #D9F99D 0%, #FDE047 100%)',
                        }}
                    >
                        {isComplete
                            ? <span className="flex items-center justify-center gap-2"><Check className="w-4 h-4" strokeWidth={3} /> Complete!</span>
                            : (creating
                                ? (isPresetMode ? 'Uploading…' : 'Creating Index…')
                                : (isPresetMode ? 'Upload Videos' : 'Create Index'))
                        }
                    </button>

                    {!creating && !indexName.trim() && videos.length === 0 && (
                        <p className="text-xs text-gray-400 text-center mt-2">
                            Fill in the index name and upload at least one video to continue.
                        </p>
                    )}
                </div>
            </div>
            {/* Indexing info modal */}
            {showIndexingInfo && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowIndexingInfo(false)}
                    />
                    <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl border border-gray-200 p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-gray-700" strokeWidth={1.8} />
                                <h3 className="text-sm font-semibold text-gray-900">
                                    About indexing time
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowIndexingInfo(false)}
                                className="p-1 rounded-md hover:bg-gray-100 cursor-pointer"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4 text-gray-500" strokeWidth={1.5} />
                            </button>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            Indexing is typically completed in <span className="font-semibold">30–40%</span> of the
                            duration of the video. However, actual indexing time also depends on the number of{' '}
                            <span className="font-semibold">concurrent indexing tasks</span>, and delays can occur if
                            many videos are being indexed at the same time.
                        </p>
                        {estimatedIndexingRange && (
                            <p className="mt-3 text-[11px] text-gray-500">
                                For this batch, a rough estimate is <span className="font-semibold">{estimatedIndexingRange}</span>{' '}
                                of total video time, assuming normal queue conditions.
                            </p>
                        )}
                        <div className="mt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setShowIndexingInfo(false)}
                                className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
