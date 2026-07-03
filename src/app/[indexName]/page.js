'use client';

import { useState, useEffect, useCallback, useMemo, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeftIcon,
    SpinnerIcon,
    PlusIcon,
    IdeaIcon,
    RefreshIcon,
    EntityIcon,
    CloseIcon,
    DownloadIcon,
    SearchIcon,
    GridIcon,
    ServersIcon,
    ArrowRightIcon,
} from '@twelvelabs-io/react';
import Sidebar from '@/components/dashboard/Sidebar';
import VideoList from '@/components/dashboard/VideoList';
import CreateIndexModal from '@/components/dashboard/CreateIndexModal';
import DownloadModal from '@/components/dashboard/DownloadModal';
import EmbeddingsView from '@/components/dashboard/EmbeddingsView';
import RateLimitModal from '@/components/dashboard/RateLimitModal';
import { parseJsonOrThrow } from '@/lib/parseJsonOrThrow';

// ─── Chunked annotation constants ───────────────────────────────────────────
// Target wall-clock span per analyze call (before slot cap). 600s = 10 minutes.
// Actual per-call span may be shorter when ceil(span/density) > ANNOTATION_MAX_SLOTS_PER_CALL.
const ANNOTATION_CHUNK_DURATION = 600;
const ANNOTATION_MIN_CHUNK_DURATION = 60; // retry floor when chunking fallback is needed
/** Parallel analyze calls (long-video path). Lower if hitting burst429s. */
const ANNOTATION_CHUNK_CONCURRENCY = 3;

// TwelveLabs caps output at 4096 tokens. Each annotation object in our schema
// costs roughly 200-220 tokens (description + timestamps + objects + actions +
// confidence fields + JSON key overhead). Capping at 12 slots per call keeps
// the expected output at ~2,600 tokens — well under the limit regardless of
// how verbose each description is. If you reduce the schema fields you can
// safely raise this number.
const ANNOTATION_MAX_SLOTS_PER_CALL = 12;

/** Scene vs action slot step (seconds). Must match densityInstruction + UI hints. */
const ANNOTATION_SCENE_SLOT_SEC = 30;
const ANNOTATION_ACTION_SLOT_SEC = 10;
/** Short clips: shrink slot step so we still get at least this many segments (see slotSec below). */
const ANNOTATION_MIN_SEGMENTS = 3;

/** Pretty-print seconds → 0:04 / 1:23:45 */
function formatDuration(s) {
    if (!s && s !== 0) return '—';
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = Math.floor(s % 60);
    if (hrs > 0) return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function IndexDetailPage({ params }) {
    const { indexName } = use(params);
    const decodedName = decodeURIComponent(indexName);
    const router = useRouter();

    const [videos, setVideos] = useState([]);
    const [indexDescription, setIndexDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [searching, setSearching] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Selection state
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Upload modal
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [downloadModalOpen, setDownloadModalOpen] = useState(false);

    // Suggested classes from analysis
    const [suggestedClasses, setSuggestedClasses] = useState(null);
    const [analyzingClasses, setAnalyzingClasses] = useState(false);
    const [analyzeError, setAnalyzeError] = useState(null);

    // Video annotation statuses (videoId -> 'ready' | 'processing' | 'needs_review')
    const [videoStatuses, setVideoStatuses] = useState({});

    // Annotation results per video (videoId -> annotations[])
    const [annotationResults, setAnnotationResults] = useState({});
    const [annotating, setAnnotating] = useState(false);

    const [activeTab, setActiveTab] = useState('library');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    /** True while /api/videos?embeddings=1 is in flight (Embeddings tab only). */
    const [embeddingsLoading, setEmbeddingsLoading] = useState(false);
    /** Avoid repeated embedding fetches if the first attempt returned no vectors. */
    const autoEmbeddingsFetchRef = useRef(false);

    const [rateLimitModal, setRateLimitModal] = useState({ open: false, partial: null });
    // partial shape: { videoId, filename, annotationCount, coveredUntil } | null
    const showRateLimitModal = useCallback((partial = null) => {
        setRateLimitModal({ open: true, partial });
    }, []);

    const SEARCH_SUGGESTIONS = [
        'People walking or standing',
        'Vehicles in motion',
        'Text or signage visible',
        'Indoor scene',
        'Outdoor scene',
        'Close-up or detailed shot',
        'Action or movement',
        'Night time or low light',
    ];

    const searchRef = useRef(null);

    // Semantic search handler
    const handleSearch = useCallback(async (query) => {
        const q = (query || search).trim();
        if (!q) {
            setSearchResults(null);
            return;
        }
        setSearching(true);
        setShowSuggestions(false);
        try {
            const res = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: q, indexName: decodedName }),
            });
            const data = await parseJsonOrThrow(res);
            // data.results contains search results with videoId, start, end, score
            const results = (data.results || []).map(r => ({
                id: r.videoId,
                clips: [{ start: r.start, end: r.end, confidence: r.score || r.confidence }],
            }));
            setSearchResults(results);
        } catch (err) {
            if (err?.isRateLimit) {
                showRateLimitModal();
            } else {
                console.error('Search error:', err);
                setSearchResults([]);
            }
        } finally {
            setSearching(false);
        }
    }, [search, decodedName, showRateLimitModal]);

    const clearSearch = useCallback(() => {
        setSearch('');
        setSearchResults(null);
        setIsSearchExpanded(false);
        setShowSuggestions(false);
    }, []);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchRef.current && !searchRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Domain-specific labels
    const [domainLabels, setDomainLabels] = useState(new Set());
    const [labelInput, setLabelInput] = useState('');

    const addLabel = useCallback((label) => {
        const trimmed = label.trim();
        if (!trimmed) return;
        setDomainLabels((prev) => new Set(prev).add(trimmed));
    }, []);

    const removeLabel = useCallback((label) => {
        setDomainLabels((prev) => {
            const next = new Set(prev);
            next.delete(label);
            return next;
        });
    }, []);

    const handleLabelKeyDown = useCallback((e) => {
        if (e.key === 'Enter' && labelInput.trim()) {
            e.preventDefault();
            addLabel(labelInput);
            setLabelInput('');
        }
    }, [labelInput, addLabel]);

    const toggleSelect = useCallback((id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    // Compute selected stats
    const selectedStats = useMemo(() => {
        const selected = videos.filter((v) => selectedIds.has(v.id));
        const totalDuration = selected.reduce((acc, v) => acc + (v.systemMetadata?.duration || 0), 0);
        return { count: selected.length, totalDuration };
    }, [videos, selectedIds]);

    // Annotation density
    const [annotationDensity, setAnnotationDensity] = useState('scene');

    // ROI calculations
    const roiStats = useMemo(() => {
        const { count, totalDuration } = selectedStats;
        // Manual: ~3× video duration for human review + labeling
        const manualTimeSec = Math.round(totalDuration * 3);
        // TwelveLabs: ~1 min per video
        const tlTimeSec = count * 60;
        const timeSavingsPercent = manualTimeSec > 0
            ? Math.round(((manualTimeSec - tlTimeSec) / manualTimeSec) * 100)
            : 0;
        // Human labor cost at $25/hr applied to manual time
        const humanCost = (manualTimeSec / 3600) * 25;
        // TwelveLabs cost: ~$0.05 per minute of video
        const tlCost = (totalDuration / 60) * 0.05;
        const costSavingsPercent = humanCost > 0
            ? Math.round(((humanCost - tlCost) / humanCost) * 100)
            : 0;
        return { manualTimeSec, tlTimeSec, timeSavingsPercent, humanCost, tlCost, costSavingsPercent };
    }, [selectedStats]);

    const fetchVideos = useCallback(async (options = {}) => {
        const { includeEmbeddings = false } = options;
        try {
            if (!includeEmbeddings) {
                autoEmbeddingsFetchRef.current = false;
                setLoading(true);
            } else {
                setEmbeddingsLoading(true);
            }
            const qs = includeEmbeddings ? '?embeddings=1' : '';
            const res = await fetch(`/api/videos${qs}`);
            const allVideos = await parseJsonOrThrow(res);

            const filtered = allVideos.filter((v) => {
                if (!v.user_metadata) return false;
                try {
                    const meta = typeof v.user_metadata === 'string'
                        ? JSON.parse(v.user_metadata)
                        : v.user_metadata;
                    return meta.indexName === decodedName;
                } catch {
                    return false;
                }
            });

            if (filtered.length > 0) {
                const meta = typeof filtered[0].user_metadata === 'string'
                    ? JSON.parse(filtered[0].user_metadata)
                    : filtered[0].user_metadata;
                setIndexDescription(meta.description || '');
            }

            setVideos(filtered);
        } catch (err) {
            if (err?.isRateLimit) {
                showRateLimitModal();
                setError(null);
            } else {
                console.error('Failed to fetch videos:', err);
                setError(err.message);
            }
            if (includeEmbeddings) autoEmbeddingsFetchRef.current = false;
        } finally {
            if (!includeEmbeddings) setLoading(false);
            else setEmbeddingsLoading(false);
        }
    }, [decodedName, showRateLimitModal]);

    useEffect(() => {
        fetchVideos();
    }, [fetchVideos]);

    // Load Marengo embeddings only when the Embeddings tab is opened (expensive: N TL API calls).
    useEffect(() => {
        if (activeTab !== 'embeddings') return;
        if (videos.length === 0) return;
        const hasEmb = videos.some(
            (v) => Array.isArray(v.embeddings) && v.embeddings.length > 0
        );
        if (hasEmb) return;
        if (autoEmbeddingsFetchRef.current) return;
        autoEmbeddingsFetchRef.current = true;
        fetchVideos({ includeEmbeddings: true });
    }, [activeTab, videos, fetchVideos]);

    // Build TwelveLabs response_format JSON schema for structured annotations
    const buildAnalyzeSchema = useCallback(() => {
        return {
            type: "json_schema",
            json_schema: {
                type: "object",
                properties: {
                    annotations: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                segment_number: { type: "number" },
                                start_timestamp: { type: "string" },
                                end_timestamp: { type: "string" },
                                description: { type: "string" },
                                scene_classification: { type: "string" },
                                detected_objects: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            label: { type: "string" },
                                            confidence_score: { type: "number" },
                                            start_timestamp: { type: "string" },
                                            end_timestamp: { type: "string" }
                                        },
                                        required: ["label", "confidence_score", "start_timestamp", "end_timestamp"]
                                    }
                                },
                                detected_actions: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            label: { type: "string" },
                                            confidence_score: { type: "number" },
                                            start_timestamp: { type: "string" },
                                            end_timestamp: { type: "string" }
                                        },
                                        required: ["label", "confidence_score", "start_timestamp", "end_timestamp"]
                                    }
                                },
                                overall_confidence: { type: "number" },
                                confidence_score: { type: "number" }
                            },
                            required: [
                                "segment_number",
                                "start_timestamp",
                                "end_timestamp",
                                "description",
                                "scene_classification",
                                "detected_objects",
                                "detected_actions",
                                "overall_confidence",
                                "confidence_score"
                            ]
                        }
                    }
                },
                required: ["annotations"]
            }
        };
    }, []);

    // Analyze first video for suggested annotation classes (discovery only — simple label list)
    const runAnalysis = useCallback(async (videoId) => {
        setAnalyzingClasses(true);
        setAnalyzeError(null);
        try {
            const prompt = `Analyze this video and list 5 maximum distinct categories of objects, actions, or events that appear frequently and would be valuable for training a computer vision model.

            Focus on:
            - Key Objects (e.g., specific vehicles, tools, distinct people types)
            - Key Actions (e.g., movements, interactions, procedural steps)
            - Critical Events (e.g., anomalies, specific state changes)

            Return ONLY a JSON object with a key 'suggested_classes' containing a list of strings. Do not provide explanations.`;

            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ videoId, prompt }),
            });
            const result = await parseJsonOrThrow(res);

            // Parse the response — the model returns JSON inside `data`
            let classes = [];
            try {
                const text = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    classes = parsed.suggested_classes || [];
                }
            } catch {
                const text = typeof result.data === 'string' ? result.data : '';
                classes = text.split(/[\n,]+/).map(s => s.replace(/^[\-\d.\s*]+/, '').trim()).filter(Boolean);
            }
            setSuggestedClasses(classes);
        } catch (err) {
            if (err?.isRateLimit) {
                showRateLimitModal();
                // Stop auto-run useEffect from repeatedly calling /api/analyze (null stays "pending").
                setSuggestedClasses([]);
            } else {
                console.error('Analysis failed:', err);
                setAnalyzeError(err.message);
            }
        } finally {
            setAnalyzingClasses(false);
        }
    }, [showRateLimitModal]);

    // Annotate selected videos.
    // Videos split into ~ANNOTATION_CHUNK_DURATION s windows (then slot-capped); batches run in parallel.
    // windows so each /api/analyze call stays within the 60 s Vercel Hobby function timeout.
    const annotateVideos = useCallback(async () => {
        const idsToAnnotate = [...selectedIds];
        if (idsToAnnotate.length === 0) return;

        setSelectedIds(new Set());
        setAnnotating(true);

        setVideoStatuses(prev => {
            const next = { ...prev };
            idsToAnnotate.forEach(id => { next[id] = 'processing'; });
            return next;
        });

        const labelList = [...domainLabels];
        const taxonomySection = labelList.length > 0
            ? `\nFocus on detecting these specific classes: ${labelList.join(', ')}.`
            : '';

        const densityInstruction = annotationDensity === 'action'
            ? `Annotation Density: Action-level - produce many high-frequency annotations (every ${ANNOTATION_ACTION_SLOT_SEC} seconds) with no gaps.`
            : `Annotation Density: Scene-level - produce comprehensive scene segments (about every ${ANNOTATION_SCENE_SLOT_SEC} seconds) with no gaps.`;

        const response_format = buildAnalyzeSchema();

        // ─── Shared helpers ──────────────────────────────────────────────────

        const toMMSS = (totalSec) => {
            const s = Math.round(Math.max(0, totalSec));
            const hrs = Math.floor(s / 3600);
            const mins = Math.floor((s % 3600) / 60);
            const secs = s % 60;
            if (hrs > 0) return `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
            return `${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
        };

        const tsToSec = (ts) => {
            if (ts == null || ts === '') return 0;
            const parts = String(ts).split(':').map(Number);
            if (parts.some(n => Number.isNaN(n))) return 0;
            if (parts.length === 2) return parts[0] * 60 + parts[1];
            if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
            return 0;
        };

        const normTS = (ts) => {
            if (ts == null) return ts;
            const str = String(ts).trim();
            if (/^\d+(\.\d+)?$/.test(str)) return toMMSS(Number(str));
            return str;
        };

        /**
         * Extract all complete annotation objects from a (possibly truncated) JSON string.
         * Used as a fallback when the top-level parse fails due to a length-truncated response.
         */
        const extractPartialAnnotations = (text) => {
            const results = [];
            // Match every {...} block that contains at least a start_timestamp key — these are
            // individual annotation objects. We walk the string to handle nested braces correctly.
            let i = 0;
            while (i < text.length) {
                if (text[i] !== '{') { i++; continue; }
                let depth = 0;
                let j = i;
                while (j < text.length) {
                    if (text[j] === '{') depth++;
                    else if (text[j] === '}') { depth--; if (depth === 0) break; }
                    j++;
                }
                if (depth === 0) {
                    const candidate = text.slice(i, j + 1);
                    if (candidate.includes('start_timestamp')) {
                        try {
                            const obj = JSON.parse(candidate);
                            if (obj.start_timestamp || obj.description) results.push(obj);
                        } catch { /* incomplete object — skip */ }
                    }
                }
                i = j + 1;
            }
            return results;
        };

        const parseAnnotations = (result) => {
            let raw = result?.data;
            if (!raw) return [];
            try {
                if (typeof raw === 'string') {
                    raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
                    const fb = raw.indexOf('{'); const lb = raw.lastIndexOf('}');
                    if (fb !== -1 && lb !== -1) raw = raw.substring(fb, lb + 1);
                    const p = JSON.parse(raw);
                    if (Array.isArray(p.annotations)) return p.annotations;
                    if (Array.isArray(p.scene_annotations)) return p.scene_annotations;
                    if (p.scene) return [p.scene];
                    if (Array.isArray(p.scenes)) return p.scenes;
                    if (Array.isArray(p)) return p;
                    if (p.detected_objects || p.detected_actions || p.description) return [p];
                    return [];
                } else {
                    const d = raw;
                    if (Array.isArray(d?.annotations)) return d.annotations;
                    if (Array.isArray(d?.scene_annotations)) return d.scene_annotations;
                    if (d?.scene) return [d.scene];
                    if (Array.isArray(d)) return d;
                    return [];
                }
            } catch {
                // Full-parse failed — try to salvage complete objects from a truncated response.
                try {
                    const text = typeof result?.data === 'string' ? result.data : JSON.stringify(result?.data ?? '');
                    // First try the outermost wrapper object
                    const m = text.match(/\{[\s\S]*\}/);
                    if (m) {
                        try {
                            const p = JSON.parse(m[0]);
                            if (Array.isArray(p.annotations)) return p.annotations;
                            if (Array.isArray(p.scene_annotations)) return p.scene_annotations;
                        } catch { /* still truncated — fall through */ }
                    }
                    // Walk the string and pull out every complete annotation object
                    const partial = extractPartialAnnotations(text);
                    if (partial.length > 0) return partial;
                } catch { /* ignore */ }
                return [];
            }
        };

        const postProcess = (anns) => {
            if (!anns?.length) return anns || [];
            return anns.map(ann => {
                const origDesc = ann.description || '';

                const extractList = (regex) => {
                    const match = origDesc.match(regex);
                    if (!match) return [];
                    const items = [];
                    for (const m of match[1].matchAll(/-\s*(.+?)\s*\(confidence_score:\s*([\d.]+)\)/gi))
                        items.push({ label: m[1].trim(), confidence_score: parseFloat(m[2]) });
                    return items;
                };

                if (!ann.detected_objects?.length && origDesc.includes('detected_objects:')) {
                    const ex = extractList(/detected_objects:\s*([\s\S]*?)(?=- detected_actions:|- overall_confidence:|$)/i);
                    if (ex.length) ann.detected_objects = ex;
                }
                if (!ann.detected_actions?.length && origDesc.includes('detected_actions:')) {
                    const ex = extractList(/detected_actions:\s*([\s\S]*?)(?=- overall_confidence:|$)/i);
                    if (ex.length) ann.detected_actions = ex;
                }
                if (!ann.scene_classification && origDesc.includes('scene_classification:')) {
                    const m = origDesc.match(/scene_classification:\s*(.+?)(?=\s*- detected_|$)/i);
                    if (m) ann.scene_classification = m[1].trim();
                }
                if (ann.overall_confidence == null && origDesc.includes('overall_confidence:')) {
                    const m = origDesc.match(/overall_confidence:\s*([\d.]+)/i);
                    if (m) ann.overall_confidence = parseFloat(m[1]);
                }
                if (ann.confidence_score == null && origDesc.includes('confidence_score:')) {
                    const m = origDesc.match(/confidence_score:\s*([\d.]+)/i);
                    if (m) ann.confidence_score = parseFloat(m[1]);
                }

                const desc = ann.description || '';
                if (desc.includes('scene_classification:') || desc.includes('detected_objects:')) {
                    const sps = ['- scene_classification:', '- detected_objects:', 'scene_classification:', 'detected_objects:', 'confidence_score:', 'overall_confidence:'];
                    let minIdx = desc.length;
                    sps.forEach(sp => { const i = desc.indexOf(sp); if (i !== -1 && i < minIdx) minIdx = i; });
                    if (minIdx < desc.length) ann.description = desc.substring(0, minIdx).trim();
                }

                ann.start_timestamp = normTS(ann.start_timestamp);
                ann.end_timestamp = normTS(ann.end_timestamp);
                if (ann.start_timestamp && !ann.timestamp) ann.timestamp = ann.start_timestamp;

                const unifyTag = (item) => {
                    const text = item.label || item.object || item.action || item.name || '';
                    const out = { ...item, label: item.label || text, name: item.name || text };
                    if (out.start_timestamp) out.start_timestamp = normTS(out.start_timestamp);
                    if (out.end_timestamp) out.end_timestamp = normTS(out.end_timestamp);
                    return out;
                };
                if (Array.isArray(ann.detected_objects)) ann.detected_objects = ann.detected_objects.map(unifyTag);
                if (Array.isArray(ann.detected_actions)) ann.detected_actions = ann.detected_actions.map(unifyTag);

                return ann;
            });
        };

        // One /api/analyze call. Always returns { annotations, lengthTruncated } (no fragile array props).
        const callChunk = async (videoId, chunkPrompt, rf, startSec, endSec) => {
            const body = { videoId, prompt: chunkPrompt, response_format: rf };
            if (startSec != null) body.startSec = Math.floor(startSec);
            if (endSec != null) body.endSec = Math.ceil(endSec);
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const result = await parseJsonOrThrow(res);

            if (result?.finishReason === 'length') {
                const salvaged = postProcess(parseAnnotations(result));
                if (salvaged.length > 0) {
                    console.warn(
                        `[annotate] finishReason=length for window ${startSec ?? 0}-${endSec ?? '?'}; ` +
                        `salvaged ${salvaged.length} annotation(s) from partial response. ` +
                        `Consider reducing chunk size or annotation density to stay under the token limit.`
                    );
                    return { annotations: salvaged, lengthTruncated: false };
                }
                console.warn(
                    `[annotate] finishReason=length AND no salvageable annotations for window ` +
                    `${startSec ?? 0}-${endSec ?? '?'}. Will use fallback annotation.`
                );
                return { annotations: [], lengthTruncated: true };
            }

            return { annotations: postProcess(parseAnnotations(result)), lengthTruncated: false };
        };

        const buildFallbackAnnotation = (startSec, endSec) => {
            const safeStart = Math.max(0, Math.floor(startSec ?? 0));
            const safeEnd = Math.max(safeStart + 1, Math.ceil(endSec ?? safeStart + 1));
            return {
                start_timestamp: toMMSS(safeStart),
                end_timestamp: toMMSS(safeEnd),
                timestamp: toMMSS(safeStart),
                description: `Fallback annotation for ${toMMSS(safeStart)}-${toMMSS(safeEnd)} because model returned no segments.`,
                scene_classification: 'fallback',
                detected_objects: [
                    {
                        label: 'unspecified object',
                        name: 'unspecified object',
                        confidence_score: 0.3,
                        start_timestamp: toMMSS(safeStart),
                        end_timestamp: toMMSS(safeEnd),
                    },
                ],
                detected_actions: [
                    {
                        label: 'unspecified action',
                        name: 'unspecified action',
                        confidence_score: 0.3,
                        start_timestamp: toMMSS(safeStart),
                        end_timestamp: toMMSS(safeEnd),
                    },
                ],
                confidence_score: 0.3,
                overall_confidence: 0.3,
            };
        };

        // ─── Per-video annotation loop ────────────────────────────────────────

        function generateTimeSlots(chunkStart, chunkEnd, slotDuration = 30) {
            const slots = [];
            let cursor = chunkStart;
            while (cursor < chunkEnd) {
                slots.push({
                    start: toMMSS(cursor),
                    end: toMMSS(Math.min(cursor + slotDuration, chunkEnd)),
                });
                cursor += slotDuration;
            }
            return slots;
        }

        /** Next chunk boundary: ANNOTATION_CHUNK_DURATION cap + ANNOTATION_MAX_SLOTS_PER_CALL. */
        function computeNextChunkEnd(chunkStart, durationSec, slotSec) {
            const remaining = durationSec - chunkStart;
            if (remaining <= 0) return chunkStart;
            const rawChunk = Math.min(ANNOTATION_CHUNK_DURATION, remaining);
            const slotsInChunk = Math.min(
                Math.ceil(rawChunk / slotSec),
                ANNOTATION_MAX_SLOTS_PER_CALL
            );
            const spanSeconds = Math.min(rawChunk, slotsInChunk * slotSec);
            return Math.min(durationSec, chunkStart + spanSeconds);
        }

        annotateLoop: for (const videoId of idsToAnnotate) {
            const video = videos.find(v => v._id === videoId || v.id === videoId);
            const duration = video?.systemMetadata?.duration || 0;

            const baseSlotSec = annotationDensity === 'action'
                ? ANNOTATION_ACTION_SLOT_SEC
                : ANNOTATION_SCENE_SLOT_SEC;
            const slotSec =
                duration > 0
                    ? Math.min(baseSlotSec, duration / ANNOTATION_MIN_SEGMENTS)
                    : baseSlotSec;

            const baseInstructions = `You are a Computer Vision Data Generation Engine.
            Your task is to generate a structured training dataset for an Object Detection model.
            ${taxonomySection}. If no taxonomy provided, determine classes from the video content first.
            ${densityInstruction}
            Total video duration: ${Math.ceil(duration)} seconds.
            Segment time bins in each prompt use ~${Number(slotSec.toFixed(2))}s steps (capped from ~${baseSlotSec}s default for short clips).

            CRITICAL INSTRUCTIONS:
            1. Populate 'detected_objects' and 'detected_actions' arrays with items.
            2. Objects/actions MUST have their own start_timestamp and end_timestamp. These timestamps should be as precise as possible and DO NOT have to match the segment timestamps. They should be exactly when the object/action starts and ends within the segmnet, not the segment timestamp itself.
            3. Each scene MUST have explicit start_timestamp and end_timestamp for the whole scene.
            4. Scene-level annotations must not overlap in time.
            5. ALL timestamps MUST be 'MM:SS' or 'HH:MM:SS' strings (e.g. '01:23'). Never raw seconds.
            6. All timestamps are absolute from 00:00 of the full video.

            CONCISENESS RULES (important — do not exceed these limits):
            - description: 1 sentence, max 20 words.
            - detected_objects: top 3 most prominent only.
            - detected_actions: top 2 most prominent only.

            TEMPORAL PRECISION (objects & actions — required):
            - For each item in detected_objects and detected_actions, set start_timestamp and end_timestamp to the
            narrowest interval YOU CAN INFER for when that specific object is clearly visible or that action is clearly
            happening INSIDE this segment’s [start_timestamp, end_timestamp] window.
            - Do NOT copy the scene’s start/end for every item by default. Full-span timestamps are ONLY allowed when
            that object/action is genuinely present or ongoing for essentially the entire segment.
            - If something appears only in part of the segment (e.g. enters mid-segment, leaves early, or a short motion),
            the timestamps MUST reflect that sub-interval (e.g. 00:18–00:22), fully inside the segment bounds.
            - If you are uncertain, prefer a shorter plausible window over spanning the whole segment; never stretch an
            interval beyond what the video supports.
            - All timestamps remain MM:SS or HH:MM:SS and must stay within this segment’s time range.

            For each annotation segment output:
            - description: What is seen/heard in this time range. This should include distinct summaries / detail on conversation dialogue if any is present and key topics said from specific people with their names.
            - scene_classification: comma-separated tags.
            - detected_objects: ARRAY of top 3 objects with start_timestamp, end_timestamp.
            - detected_actions: ARRAY of top 2 actions with start_timestamp, end_timestamp.
            - confidence_score: 0-1 confidence for this segment.
            - overall_confidence: 0-1 overall quality (consistent across all segments).
            
            Ensure to keep your entire output under 4096 tokens.
            
            `;

            let annotations = [];
            try {

                const runOneAnalyzeWindow = async (chunkStart, chunkEnd) => {
                    const windowStart = toMMSS(chunkStart);
                    const windowEnd = toMMSS(chunkEnd);
                    const slots = generateTimeSlots(chunkStart, chunkEnd, slotSec);
                    const slotPrompts = slots.map((slot, slotIndex) =>
                        `[Segment ${slotIndex + 1} - ${slot.start} to ${slot.end}]`
                    );
                    const chunkPrompt = `[WINDOW ${windowStart} to ${windowEnd}]
 Annotate ONLY the portion of this video from ${windowStart} to ${windowEnd}.

                            You MUST produce exactly ${slots.length} annotations with segment_number 1 through ${slots.length}, one for each time range:

                            ${slotPrompts.join('\n')}

                            For EACH segment: set segment_number to match the number above, set start_timestamp and end_timestamp to match the times above.
                            If a segment looks similar to the previous one, still produce a separate annotation describing the current state.
                            Do NOT combine segments. Do NOT skip segments.

                            ${baseInstructions}`;

                    let { annotations: chunkAnns, lengthTruncated } = await callChunk(
                        videoId,
                        chunkPrompt,
                        response_format,
                        chunkStart,
                        chunkEnd
                    );
                    if (chunkAnns.length === 0 && !lengthTruncated) {
                        const enforcePrompt = `${chunkPrompt}

                                    FINAL REQUIREMENT:
                                    - Return at least ONE annotation segment.
                                    - If uncertain, return one single segment that spans exactly ${windowStart} to ${windowEnd}.`;
                        ({ annotations: chunkAnns, lengthTruncated } = await callChunk(
                            videoId,
                            enforcePrompt,
                            response_format,
                            chunkStart,
                            chunkEnd
                        ));
                    }
                    if (chunkAnns.length === 0) {
                        console.warn(`[annotate] window ${windowStart}->${windowEnd} still empty; injecting fallback segment.`);
                        chunkAnns = [buildFallbackAnnotation(chunkStart, chunkEnd)];
                    }
                    return chunkAnns;
                };

                /** Sequential [wStart,wEnd) with halving retry (same chunkStart until success). */
                const runWindowPartition = async (wStart, wEnd) => {
                    const local = [];
                    let chunkStart = wStart;
                    while (chunkStart < wEnd) {
                        let chunkSize = wEnd - chunkStart;
                        let chunkDone = false;
                        while (!chunkDone) {
                            const chunkEnd = Math.min(chunkStart + chunkSize, wEnd);
                            const windowStart = toMMSS(chunkStart);
                            const windowEnd = toMMSS(chunkEnd);
                            console.log(
                                `[annotate] ${windowStart}->${windowEnd} (${Math.round(chunkEnd - chunkStart)}s try, videoId=${videoId})`
                            );
                            try {
                                const chunkAnns = await runOneAnalyzeWindow(chunkStart, chunkEnd);
                                local.push(...chunkAnns);
                                chunkStart = chunkEnd;
                                chunkDone = true;
                            } catch (chunkErr) {
                                if (chunkErr?.isRateLimit) throw chunkErr;
                                if (chunkSize <= ANNOTATION_MIN_CHUNK_DURATION) {
                                    throw chunkErr;
                                }
                                chunkSize = Math.max(
                                    ANNOTATION_MIN_CHUNK_DURATION,
                                    Math.floor(chunkSize / 2)
                                );
                                console.warn(
                                    `[annotate] window failed ${windowStart}->${windowEnd}. Retrying with smaller slice (${chunkSize}s).`,
                                    chunkErr
                                );
                            }
                        }
                    }
                    return local;
                };

                const windows = [];
                let c = 0;
                while (c < duration) {
                    const e = computeNextChunkEnd(c, duration, slotSec);
                    if (e <= c) break;
                    windows.push([c, e]);
                    c = e;
                }

                for (let i = 0; i < windows.length; i += ANNOTATION_CHUNK_CONCURRENCY) {
                    const batch = windows.slice(i, i + ANNOTATION_CHUNK_CONCURRENCY);
                    const settled = await Promise.allSettled(
                        batch.map(([s, e]) => runWindowPartition(s, e))
                    );
                    let firstError = null;
                    for (const result of settled) {
                        if (result.status === 'fulfilled') {
                            annotations.push(...result.value);
                        } else if (!firstError) {
                            firstError = result.reason;
                        }
                    }
                    if (firstError) throw firstError;
                }

                annotations.sort((a, b) => tsToSec(a.start_timestamp) - tsToSec(b.start_timestamp));
                annotations.forEach((ann, i) => {
                    ann.segment_number = i + 1;
                });

                // Confidence & status
                let avgConfidence = 0;
                const scores = annotations.map(a => a.confidence_score || a.overall_confidence).filter(s => s != null);
                if (scores.length > 0) avgConfidence = scores.reduce((a, b) => a + b, 0) / scores.length;
                else if (annotations[0]?.overall_confidence != null) avgConfidence = annotations[0].overall_confidence;

                const status = avgConfidence >= 0.7 ? 'ready' : 'needs_review';
                setVideoStatuses(prev => ({ ...prev, [videoId]: status }));

                // Persist
                setAnnotationResults(prev => ({ ...prev, [videoId]: annotations }));

                const videoObj = videos.find(v => v._id === videoId || v.id === videoId);
                const filename = videoObj?.systemMetadata?.filename || videoId;
                const storageKey = `annotations_${decodedName}_${filename}`;
                try {
                    localStorage.setItem(storageKey, JSON.stringify({
                        videoId,
                        indexName: decodedName,
                        filename,
                        annotations,
                        annotatedAt: new Date().toISOString(),
                        hls: videoObj?.hls,
                        systemMetadata: videoObj?.systemMetadata,
                        avgConfidence,
                    }));
                } catch (e) {
                    console.warn('Failed to save annotations to localStorage:', e);
                }

            } catch (err) {
                if (err?.isRateLimit) {
                    // CheckCircle whatever chunks completed for this video before stopping.
                    let partialContext = null;
                    if (annotations.length > 0) {
                        const videoObj = videos.find(v => v._id === videoId || v.id === videoId);
                        const filename = videoObj?.systemMetadata?.filename || videoId;
                        const storageKey = `annotations_${decodedName}_${filename}`;
                        const lastAnn = annotations[annotations.length - 1];
                        const coveredUntil = lastAnn?.end_timestamp ?? null;
                        try {
                            localStorage.setItem(storageKey, JSON.stringify({
                                videoId,
                                indexName: decodedName,
                                filename,
                                annotations,
                                partial: true,
                                annotatedAt: new Date().toISOString(),
                                hls: videoObj?.hls,
                                systemMetadata: videoObj?.systemMetadata,
                                avgConfidence: 0,
                            }));
                        } catch (e) {
                            console.warn('Failed to save partial annotations to localStorage:', e);
                        }
                        setAnnotationResults(prev => ({ ...prev, [videoId]: annotations }));
                        setVideoStatuses(prev => ({ ...prev, [videoId]: 'needs_review' }));
                        partialContext = { videoId, filename, annotationCount: annotations.length, coveredUntil };
                    }
                    setVideoStatuses((prev) => {
                        const next = { ...prev };
                        idsToAnnotate.forEach((id) => {
                            if (next[id] === 'processing') next[id] = 'needs_review';
                        });
                        return next;
                    });
                    showRateLimitModal(partialContext);
                    break annotateLoop;
                }
                console.error(`Annotation failed for ${videoId}:`, err);
                setVideoStatuses(prev => ({ ...prev, [videoId]: 'needs_review' }));
            }
        }

        setAnnotating(false);
    }, [selectedIds, domainLabels, annotationDensity, buildAnalyzeSchema, videos, decodedName, showRateLimitModal]);

    // Restore annotation statuses from localStorage when videos load
    useEffect(() => {
        if (videos.length === 0) return;
        const restoredStatuses = {};
        const restoredResults = {};
        for (const video of videos) {
            const filename = video.systemMetadata?.filename || video.id;
            const storageKey = `annotations_${decodedName}_${filename}`;
            try {
                const stored = localStorage.getItem(storageKey);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    const annotations = parsed.annotations || [];
                    restoredResults[video.id] = annotations;

                    const confidences = annotations
                        .map(a => a.overall_confidence)
                        .filter(c => typeof c === 'number');
                    const avg = confidences.length > 0
                        ? confidences.reduce((s, c) => s + c, 0) / confidences.length
                        : 0;
                    restoredStatuses[video.id] = avg >= 0.7 ? 'ready' : 'needs_review';
                }
            } catch { /* ignore corrupt entries */ }
        }
        if (Object.keys(restoredStatuses).length > 0) {
            setVideoStatuses(prev => ({ ...prev, ...restoredStatuses }));
            setAnnotationResults(prev => ({ ...prev, ...restoredResults }));
        }
    }, [videos, decodedName]);

    // Trigger analysis once videos are loaded (only while still "unset" — null, not []).
    useEffect(() => {
        if (videos.length > 0 && suggestedClasses === null && !analyzingClasses) {
            runAnalysis(videos[0].id);
        }
    }, [videos, suggestedClasses, analyzingClasses, runAnalysis]);

    return (
        <div className="flex min-h-screen">
            <Sidebar />

            <main className="flex-1 lg:ml-60 p-4 lg:p-6 pb-52">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => router.push('/indexes')}
                        className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground-body transition-colors mb-4 cursor-pointer"
                    >
                        <ArrowLeftIcon className="w-4 h-4" />
                        Back to Indexes
                    </button>

                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground-body">
                                {decodedName}
                            </h1>

                            {indexDescription && (
                                <p className="text-sm text-foreground-secondary mt-1.5 max-w-2xl">
                                    {indexDescription}
                                </p>
                            )}

                            <p className="text-xs text-foreground-subtle mt-2">
                                {loading
                                    ? 'Loading videos…'
                                    : `${videos.length} video${videos.length !== 1 ? 's' : ''} in this index`}
                            </p>
                        </div>

                        {/* Header actions */}
                        {!loading && (
                            <div className="flex items-center gap-3 shrink-0">
                                {/* Semantic Search Bar */}
                                <div ref={searchRef} className={`relative transition-all duration-300 ease-in-out ${isSearchExpanded ? 'w-80 md:w-[480px]' : 'w-56 md:w-64'}`}>
                                    <div className={`
                                        absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors
                                        ${isSearchExpanded ? 'text-tl-master-brand-green' : 'text-foreground-subtle'}
                                    `}>
                                        {searching
                                            ? <SpinnerIcon className="w-4 h-4 animate-spin" />
                                            : <SearchIcon className="w-4 h-4" />}
                                    </div>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onFocus={() => { setIsSearchExpanded(true); if (!search) setShowSuggestions(true); }}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
                                        placeholder={isSearchExpanded ? "Describe what you're looking for…" : "Semantic Search…"}
                                        className={`
                                            w-full pl-10 pr-20 py-2.5 rounded-xl text-sm transition-all
                                            border bg-surface-white text-foreground-body placeholder:text-foreground-subtle
                                            focus:outline-none focus:ring-2 focus:ring-tl-master-brand-green/20
                                            ${isSearchExpanded
                                                ? 'border-tl-master-brand-green shadow-lg shadow-tl-master-brand-green/10'
                                                : 'border-border-secondary hover:border-border-secondary'}
                                        `}
                                    />
                                    {/* Action buttons */}
                                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
                                        {(search || searchResults) && (
                                            <button
                                                onClick={clearSearch}
                                                className="p-1 rounded-md cursor-pointer text-foreground-subtle hover:text-foreground-body hover:bg-surface-card transition-colors"
                                                title="Clear search"
                                            >
                                                <CloseIcon className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                        {search.trim() && (
                                            <button
                                                onClick={() => handleSearch()}
                                                disabled={searching}
                                                className="p-1.5 rounded-lg cursor-pointer bg-tl-master-brand-green hover:bg-tl-master-brand-dark-green text-white transition-colors disabled:opacity-50"
                                                title="Search (Enter)"
                                            >
                                                <ArrowRightIcon className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Preset Suggestions Dropdown */}
                                    {showSuggestions && isSearchExpanded && !search && (
                                        <div className="absolute top-full left-0 right-0 mt-2 rounded-xl border border-border-secondary bg-surface-white shadow-xl z-50 overflow-hidden animate-fade-in">
                                            <div className="px-3 pt-3 pb-1.5">
                                                <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">Try searching for…</p>
                                            </div>
                                            <div className="pb-1.5">
                                                {SEARCH_SUGGESTIONS.map((suggestion) => (
                                                    <button
                                                        key={suggestion}
                                                        onMouseDown={(e) => {
                                                            e.preventDefault();
                                                            setSearch(suggestion);
                                                            setShowSuggestions(false);
                                                            handleSearch(suggestion);
                                                        }}
                                                        className="w-full text-left px-3 py-2 text-sm text-foreground-secondary hover:bg-surface-card hover:text-foreground-body transition-colors flex items-center gap-2.5 cursor-pointer"
                                                    >
                                                        <IdeaIcon className="w-3.5 h-3.5 text-tl-master-brand-light-green shrink-0" />
                                                        {suggestion}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Download Annotations */}
                                <div className="relative group/dl">
                                    <button
                                        onClick={() => Object.keys(videoStatuses).length > 0 && setDownloadModalOpen(true)}
                                        disabled={Object.keys(videoStatuses).length === 0}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${Object.keys(videoStatuses).length > 0
                                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 cursor-pointer'
                                            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <DownloadIcon className="w-4 h-4" />
                                        <span className="hidden md:inline">Download</span>
                                    </button>
                                    {Object.keys(videoStatuses).length === 0 && (
                                        <div className="absolute right-0 top-full mt-2 px-3 py-2 rounded-lg bg-gray-900 dark:bg-gray-800 shadow-lg border border-border-secondary whitespace-nowrap pointer-events-none opacity-0 group-hover/dl:opacity-100 transition-opacity duration-200 z-30">
                                            <p className="text-xs text-gray-300">Annotate at least one video first</p>
                                            <div className="absolute -top-1 right-4 w-2 h-2 rotate-45 bg-gray-900 dark:bg-gray-800 border-l border-t border-border-secondary" />
                                        </div>
                                    )}
                                </div>

                                {/* Upload Videos */}
                                <button
                                    onClick={() => setUploadModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-900 cursor-pointer hover:brightness-95 transition-all"
                                    style={{ background: 'linear-gradient(135deg, var(--tl-color-master-brand-green) 0%, var(--tl-color-master-brand-orange) 100%)' }}
                                >
                                    <PlusIcon className="w-4 h-4" />
                                    <span className="hidden md:inline">Upload</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Navigation Tabs */}
                    {!loading && (
                        <div className="flex items-center gap-6 mt-6 border-b border-border-secondary">
                            <button
                                onClick={() => setActiveTab('library')}
                                className={`flex items-center gap-2 pb-3 text-sm font-medium transition-all relative ${activeTab === 'library'
                                    ? 'text-tl-master-brand-dark-green dark:text-tl-master-brand-light-green'
                                    : 'text-foreground-subtle hover:text-foreground-body'
                                    }`}
                            >
                                <GridIcon className="w-4 h-4" />
                                Library
                                {activeTab === 'library' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-tl-master-brand-green rounded-t-full" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('embeddings')}
                                className={`flex items-center gap-2 pb-3 text-sm font-medium transition-all relative ${activeTab === 'embeddings'
                                    ? 'text-tl-master-brand-dark-green dark:text-tl-master-brand-light-green'
                                    : 'text-foreground-subtle hover:text-foreground-body'
                                    }`}
                            >
                                <ServersIcon className="w-4 h-4" />
                                Embeddings
                                {activeTab === 'embeddings' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-tl-master-brand-green rounded-t-full" />
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Library Tab Content */}
                {activeTab === 'library' && (
                    <>
                        {/* Label Taxonomy (Combined) */}
                        {!loading && !error && (
                            <div className="mb-8 rounded-2xl border border-border-secondary bg-surface-white overflow-hidden">
                                {/* Header */}
                                <div className="px-5 pt-5 pb-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <EntityIcon className="w-4 h-4 text-foreground-secondary" />
                                            <h2 className="text-sm font-semibold text-foreground-body">
                                                Label Taxonomy
                                            </h2>
                                            {domainLabels.size > 0 && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-card text-foreground-subtle font-tl-mono">
                                                    {domainLabels.size}
                                                </span>
                                            )}
                                        </div>
                                        {suggestedClasses && (
                                            <button
                                                onClick={() => { setSuggestedClasses(null); runAnalysis(videos[0]?.id); }}
                                                disabled={analyzingClasses}
                                                className="flex items-center gap-1.5 text-xs text-foreground-subtle hover:text-foreground-secondary transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                                <RefreshIcon className={`w-3 h-3 ${analyzingClasses ? 'animate-spin' : ''}`} />
                                                Re-analyze
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-foreground-subtle">
                                        Define annotation categories for standardized output. Add AI-suggested labels or type your own.
                                    </p>
                                </div>

                                {/* Your labels + input */}
                                <div className="px-5 pb-4">
                                    <div className="relative mb-3 max-w-sm">
                                        <input
                                            type="text"
                                            value={labelInput}
                                            onChange={(e) => setLabelInput(e.target.value)}
                                            onKeyDown={handleLabelKeyDown}
                                            placeholder="Add a custom label… (press Enter)"
                                            className="w-full pl-3 pr-10 py-2 rounded-xl border border-border-secondary bg-surface-card text-sm text-foreground-body placeholder:text-foreground-subtle outline-none focus:border-tl-master-brand-light-green focus:ring-2 focus:ring-tl-master-brand-green/20 transition"
                                        />
                                        {labelInput.trim() && (
                                            <button
                                                onClick={() => { addLabel(labelInput); setLabelInput(''); }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-surface-card transition-colors cursor-pointer"
                                            >
                                                <PlusIcon className="w-4 h-4 text-tl-master-brand-green" />
                                            </button>
                                        )}
                                    </div>

                                    {domainLabels.size > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {[...domainLabels].map((label) => (
                                                <span
                                                    key={label}
                                                    className="group/chip flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-tl-master-brand-lightest-emeraldgreen/15 text-tl-master-brand-dark-green dark:text-tl-master-brand-light-green border border-tl-master-brand-green/25 transition-colors"
                                                >
                                                    {label}
                                                    <button
                                                        onClick={() => removeLabel(label)}
                                                        className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                                                    >
                                                        <CloseIcon className="w-3 h-3 text-tl-master-brand-light-green group-hover/chip:text-red-500" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-foreground-subtle italic">
                                            No labels yet — add from AI suggestions below or type your own above.
                                        </p>
                                    )}
                                </div>

                                {/* Divider + AI suggestions */}
                                {(suggestedClasses || analyzingClasses || analyzeError) && (
                                    <div className="border-t border-border-secondary bg-surface-card/50 px-5 py-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <IdeaIcon className="w-3.5 h-3.5 text-tl-master-brand-green" />
                                            <span className="text-xs font-medium text-foreground-secondary">
                                                AI Suggestions
                                            </span>
                                            <span className="text-[10px] text-foreground-subtle">
                                                powered by TwelveLabs Pegasus
                                            </span>
                                        </div>

                                        {analyzingClasses && (
                                            <div className="flex items-center gap-3 py-2">
                                                <SpinnerIcon className="w-4 h-4 text-tl-master-brand-green animate-spin" />
                                                <span className="text-sm text-foreground-secondary">Analyzing video content…</span>
                                            </div>
                                        )}

                                        {analyzeError && (
                                            <div className="flex items-center justify-between py-2">
                                                <span className="text-sm text-red-500 dark:text-red-400">Failed to analyze: {analyzeError}</span>
                                                <button
                                                    onClick={() => runAnalysis(videos[0]?.id)}
                                                    className="text-xs font-medium text-tl-master-brand-green hover:text-tl-master-brand-light-green cursor-pointer"
                                                >
                                                    Retry
                                                </button>
                                            </div>
                                        )}

                                        {suggestedClasses && suggestedClasses.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {suggestedClasses.map((cls, i) => {
                                                    const isAdded = domainLabels.has(cls);
                                                    return (
                                                        <button
                                                            key={i}
                                                            onClick={(e) => { e.stopPropagation(); isAdded ? removeLabel(cls) : addLabel(cls); }}
                                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${isAdded
                                                                ? 'bg-tl-master-brand-green text-gray-900 border-tl-master-brand-green'
                                                                : 'bg-surface-white text-foreground-secondary border-border-secondary hover:border-tl-master-brand-light-green hover:text-tl-master-brand-green'
                                                                }`}
                                                        >
                                                            {isAdded ? (
                                                                <>
                                                                    <span>✓</span>
                                                                    {cls}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <PlusIcon className="w-3 h-3" />
                                                                    {cls}
                                                                </>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Content */}
                        {loading && (
                            <div className="flex items-center justify-center py-20">
                                <SpinnerIcon className="w-6 h-6 text-foreground-subtle animate-spin" />
                            </div>
                        )}

                        {error && (
                            <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 p-4">
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    Failed to load videos: {error}
                                </p>
                            </div>
                        )}

                        {!loading && !error && (
                            <VideoList
                                videos={videos}
                                indexName={decodedName}
                                search={search}
                                onSearchChange={setSearch}
                                selectedIds={selectedIds}
                                onToggleSelect={toggleSelect}
                                videoStatuses={videoStatuses}
                                searchResults={searchResults}
                            />
                        )}
                    </>
                )}

                {/* Embeddings Tab Content */}
                {activeTab === 'embeddings' && (
                    <EmbeddingsView videos={videos} isFetchingEmbeddings={embeddingsLoading} />
                )}
            </main>

            {/* Sticky annotate bar */}
            {selectedStats.count > 0 && (
                <div className="fixed bottom-0 left-0 lg:left-60 right-0 z-30 bg-surface-white border-t border-border-secondary shadow-[0_-4px_20px_rgba(0,0,0,0.08)] animate-fade-in">
                    {/* Settings row */}
                    <div className="border-b border-border-secondary px-4 lg:px-6 py-3">
                        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
                            {/* Annotation density */}
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">
                                    Annotation Density
                                </span>
                                <div className="flex rounded-lg border border-border-secondary overflow-hidden">
                                    <button
                                        onClick={() => setAnnotationDensity('scene')}
                                        className={`px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${annotationDensity === 'scene'
                                            ? 'bg-tl-master-brand-green/20 text-foreground-body border-r border-border-secondary'
                                            : 'text-foreground-subtle hover:text-foreground-secondary hover:bg-gray-50 dark:hover:bg-gray-800 border-r border-border-secondary'
                                            }`}
                                    >
                                        Scene-level
                                        <span className="ml-1 text-[10px] text-foreground-subtle">~{ANNOTATION_SCENE_SLOT_SEC}s bins</span>
                                    </button>
                                    <button
                                        onClick={() => setAnnotationDensity('action')}
                                        className={`px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${annotationDensity === 'action'
                                            ? 'bg-tl-master-brand-green/20 text-foreground-body'
                                            : 'text-foreground-subtle hover:text-foreground-secondary hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        Action-level
                                        <span className="ml-1 text-[10px] text-foreground-subtle">~{ANNOTATION_ACTION_SLOT_SEC}s bins</span>
                                    </button>
                                </div>
                            </div>

                            {/* ROI stats */}
                            <div className="flex items-center gap-3 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-foreground-subtle">Manual:</span>
                                    <span className="font-tl-mono font-medium text-red-500 dark:text-red-400">
                                        {formatDuration(roiStats.manualTimeSec)}
                                    </span>
                                </div>
                                <span className="text-foreground-subtle">→</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-foreground-subtle">TwelveLabs:</span>
                                    <span className="font-tl-mono font-medium text-green-600 dark:text-green-400">
                                        {formatDuration(roiStats.tlTimeSec)}
                                    </span>
                                </div>
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    {roiStats.timeSavingsPercent}% faster
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action row */}
                    <div className="px-4 lg:px-6 py-3">
                        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                            <div className="flex items-center gap-5">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-foreground-body">
                                        {selectedStats.count} video{selectedStats.count !== 1 ? 's' : ''} selected
                                    </span>
                                    <span className="text-xs text-foreground-subtle font-tl-mono">
                                        {formatDuration(selectedStats.totalDuration)}
                                    </span>
                                </div>
                                <div className="h-4 w-px bg-border-secondary" />
                                <div className="flex items-center gap-2.5 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-foreground-subtle">Human:</span>
                                        <span className="font-tl-mono font-semibold text-red-500 dark:text-red-400">
                                            ${roiStats.humanCost.toFixed(2)}
                                        </span>
                                    </div>
                                    <span className="text-foreground-subtle">→</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-foreground-subtle">TwelveLabs:</span>
                                        <span className="font-tl-mono font-semibold text-green-600 dark:text-green-400">
                                            ${roiStats.tlCost.toFixed(2)}
                                        </span>
                                    </div>
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                        {roiStats.costSavingsPercent}% savings
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={annotateVideos}
                                disabled={annotating}
                                className={`px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-900 transition-all ${annotating ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:brightness-95'}`}
                                style={{ background: 'linear-gradient(135deg, var(--tl-color-master-brand-green) 0%, var(--tl-color-master-brand-orange) 100%)' }}
                            >
                                {annotating ? (
                                    <span className="flex items-center gap-2">
                                        <SpinnerIcon className="w-4 h-4 animate-spin" />
                                        Annotating…
                                    </span>
                                ) : (
                                    <>Annotate {selectedStats.count} VideoIcon{selectedStats.count !== 1 ? 's' : ''}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Upload modal with preset index name/description */}
            <CreateIndexModal
                open={uploadModalOpen}
                onClose={() => setUploadModalOpen(false)}
                onComplete={fetchVideos}
                presetIndexName={decodedName}
                presetDescription={indexDescription}
            />

            {/* Download modal */}
            <RateLimitModal
                open={rateLimitModal.open}
                partial={rateLimitModal.partial}
                onClose={() => setRateLimitModal({ open: false, partial: null })}
            />

            <DownloadModal
                isOpen={downloadModalOpen}
                onClose={() => setDownloadModalOpen(false)}
                totalVideos={Object.keys(annotationResults).length}
                onDownload={(format) => {
                    const annotated = videos.filter((v) => annotationResults[v.id]);
                    let content, filename, mimeType;

                    if (format === 'json') {
                        const data = annotated.map((v) => ({
                            videoId: v.id,
                            filename: v.systemMetadata?.filename || v.id,
                            duration: v.systemMetadata?.duration || 0,
                            annotations: annotationResults[v.id] || [],
                        }));
                        content = JSON.stringify(data, null, 2);
                        filename = `${decodedName}_annotations.json`;
                        mimeType = 'application/json';
                    } else if (format === 'csv') {
                        const rows = ['videoId,filename,timestamp_start,timestamp_end,label,description'];
                        annotated.forEach((v) => {
                            (annotationResults[v.id] || []).forEach((a) => {
                                rows.push([
                                    v.id,
                                    v.systemMetadata?.filename || v.id,
                                    a.start_timestamp ?? '',
                                    a.end_timestamp ?? '',
                                    `"${(a.label || '').replace(/"/g, '""')}"`,
                                    `"${(a.description || '').replace(/"/g, '""')}"`,
                                ].join(','));
                            });
                        });
                        content = rows.join('\n');
                        filename = `${decodedName}_annotations.csv`;
                        mimeType = 'text/csv';
                    } else {
                        // COCO format
                        const coco = {
                            info: { description: decodedName, date_created: new Date().toISOString() },
                            videos: annotated.map((v, i) => ({
                                id: i + 1,
                                file_name: v.systemMetadata?.filename || v.id,
                                duration: v.systemMetadata?.duration || 0,
                            })),
                            annotations: [],
                            categories: [],
                        };
                        const catMap = {};
                        let annId = 1;
                        annotated.forEach((v, vi) => {
                            (annotationResults[v.id] || []).forEach((a) => {
                                if (a.label && !catMap[a.label]) {
                                    catMap[a.label] = Object.keys(catMap).length + 1;
                                }
                                coco.annotations.push({
                                    id: annId++,
                                    video_id: vi + 1,
                                    category_id: catMap[a.label] || 0,
                                    start: a.start_timestamp ?? 0,
                                    end: a.end_timestamp ?? 0,
                                    description: a.description || '',
                                });
                            });
                        });
                        coco.categories = Object.entries(catMap).map(([name, id]) => ({ id, name }));
                        content = JSON.stringify(coco, null, 2);
                        filename = `${decodedName}_annotations_coco.json`;
                        mimeType = 'application/json';
                    }

                    const blob = new Blob([content], { type: mimeType });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = filename;
                    a.click();
                    URL.revokeObjectURL(url);
                }}
            />
        </div>
    );
}
