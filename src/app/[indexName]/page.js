'use client';

import { useState, useEffect, useCallback, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Plus, Sparkles, RefreshCw, Tag, X, PlusCircle, Download, Search, LayoutGrid, Database } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import VideoList from '@/components/dashboard/VideoList';
import CreateIndexModal from '@/components/dashboard/CreateIndexModal';
import DownloadModal from '@/components/dashboard/DownloadModal';
import EmbeddingsView from '@/components/dashboard/EmbeddingsView';

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

    // Selection state
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Upload modal
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

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

    useEffect(() => {
        async function fetchVideos() {
            try {
                const res = await fetch('/api/videos');
                if (!res.ok) throw new Error(`API error: ${res.status}`);
                const allVideos = await res.json();

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
                console.error('Failed to fetch videos:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchVideos();
    }, [decodedName]);

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
                                }
                            },
                            overall_confidence: { type: "number" },
                            confidence_score: { type: "number" }
                        },
                        required: ["start_timestamp", "end_timestamp", "description", "scene_classification", "detected_objects", "detected_actions", "overall_confidence", "confidence_score"]
                    }
                }
            },
            required: ["annotations"]
        }
    }, []);

    // Analyze first video for suggested annotation classes (discovery only — simple label list)
    const runAnalysis = useCallback(async (videoId) => {
        setAnalyzingClasses(true);
        setAnalyzeError(null);
        try {
            const prompt = `Analyze this video and list 5-10 distinct categories of objects, actions, or events that appear frequently and would be valuable for training a computer vision model.

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
            if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
            const result = await res.json();

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
            console.error('Analysis failed:', err);
            setAnalyzeError(err.message);
        } finally {
            setAnalyzingClasses(false);
        }
    }, []);

    // Annotate selected videos — calls analyze API for each, tracks status
    const annotateVideos = useCallback(async () => {
        const idsToAnnotate = [...selectedIds];
        if (idsToAnnotate.length === 0) return;

        // Immediately uncheck all selections
        setSelectedIds(new Set());
        setAnnotating(true);

        // Set all selected to 'processing'
        setVideoStatuses(prev => {
            const next = { ...prev };
            idsToAnnotate.forEach(id => { next[id] = 'processing'; });
            return next;
        });

        // Build label taxonomy section from user-defined labels
        const labelList = [...domainLabels];
        const taxonomySection = labelList.length > 0
            ? `\nFocus on detecting these specific classes: ${labelList.join(', ')}.`
            : '';

        // Map density selection to prompt instructions
        const densityInstruction = annotationDensity === 'action'
            ? 'Annotation Density: Action-level — produce many high-frequency annotations (every 2-5 seconds). Cover the ENTIRE video duration with no gaps.'
            : 'Annotation Density: Scene-level — produce comprehensive scene segments that cover the ENTIRE video duration. Do not leave large gaps between scenes.';

        const response_format = buildAnalyzeSchema();

        for (const videoId of idsToAnnotate) {
            // Get video duration
            const video = videos.find(v => v._id === videoId || v.id === videoId);
            const duration = video?.systemMetadata?.duration || 0;
            const durationText = duration ? `The video is ${Math.ceil(duration)} seconds long.` : '';

            const prompt = `You are a Computer Vision Data Generation Engine. 
        Your task is to generate a structured training dataset for an Object Detection model.
        ${taxonomySection}. If no analyze the video first to generate a list of classes to use and then use those classes to generate the annotations.
        ${densityInstruction}
        ${durationText}

        Must include at least one object and one action per annotation.
        Must include at least 3 annotations per video. They should be spread out across the video and have variable durations.
        
        CRITICAL INSTRUCTIONS FOR JSON OUTPUT:
        1. **Populate Arrays**: You MUST put object and action details into the 'detected_objects' and 'detected_actions' arrays. 
        2. **Precise Timestamps**: 
           - The 'detected_objects' and 'detected_actions' items MUST have their own 'start_timestamp' and 'end_timestamp' which can trigger *within* the scene.
           - Example: Scene is 00:00-00:10. Object 'car' is visible 00:02-00:05. record 00:02-00:05 for the object.
        3. **Atomic Events**: If an object changes state (e.g. from "driving" to "stopped"), create a new annotation segment or distinct action entry.
        4. **No Overlapping Annotations**: Ensure that no two annotations overlap in time. This means YOU MUST ensure that no two annotations have start_timestamp and end_timestamp that overlap.
        5. **Full Coverage**: Ensure that the entire video is covered by annotations. This means there should be annotations covering from 0 seconds to ${Math.ceil(duration)} seconds.
        6. **First Person Perspective**: Ensure that the annotations are from the first person perspective. This means that the annotations should be from the point of view of the camera and DO NOT reference the camera, angles changing, lighting, etc. It should focus on the context and video content, not how it was created.

        For each annotation segment, structure the data exactly as defined in the schema:
        - description: Description of the scene, audio, and events seen within that time frame of the video.
        - scene_classification: comma-separated tags.
        - detected_objects: ARRAY of objects.
        - detected_actions: ARRAY of actions.
        - confidence_score: A number between 0 and 1 indicating how confident you are in this specific annotation segment.
        - overall_confidence: A number between 0 and 1 indicating the overall quality and confidence of the entire set of annotations for this video (should be consistent across all segments).
        
        `;

            try {
                const res = await fetch('/api/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ videoId, prompt, response_format }),
                });
                if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
                const result = await res.json();

                // Parse annotations — try JSON first, then plain text
                let annotations = [];
                try {
                    let rawData = result.data;
                    if (typeof rawData === 'string') {
                        // Strip markdown code blocks if present
                        rawData = rawData.replace(/```json/g, '').replace(/```/g, '').trim();
                        // Find the first '{' and last '}' to handle potential prologue/epilogue text
                        const firstBrace = rawData.indexOf('{');
                        const lastBrace = rawData.lastIndexOf('}');
                        if (firstBrace !== -1 && lastBrace !== -1) {
                            rawData = rawData.substring(firstBrace, lastBrace + 1);
                        }
                        const parsed = JSON.parse(rawData);

                        // Handle various potential output structures
                        if (parsed.annotations && Array.isArray(parsed.annotations)) {
                            annotations = parsed.annotations;
                        } else if (parsed.scene) {
                            // Single scene object
                            annotations = [parsed.scene];
                        } else if (parsed.scenes && Array.isArray(parsed.scenes)) {
                            annotations = parsed.scenes;
                        } else if (Array.isArray(parsed)) {
                            annotations = parsed;
                        } else if (parsed.detected_objects || parsed.detected_actions || parsed.description) {
                            // Root object is likely the scene itself
                            annotations = [parsed];
                        } else {
                            annotations = [];
                        }
                    } else {
                        // Fallback for non-string rawData (already parsed JSON?)
                        const d = rawData;
                        if (d?.annotations) annotations = d.annotations;
                        else if (d?.scene) annotations = [d.scene];
                        else if (Array.isArray(d)) annotations = d;
                        else annotations = [];
                    }
                } catch (e) {
                    console.error("JSON Parse failed", e);
                    // Try to find embedded JSON with regex as last resort
                    try {
                        const text = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
                        const jsonMatch = text.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            const parsed = JSON.parse(jsonMatch[0]);
                            annotations = parsed.annotations || [];
                        }
                    } catch { /* not JSON either */ }
                }

                // Post-process annotations to fix missing fields if stuck in description
                if (annotations.length > 0) {
                    annotations = annotations.map(ann => {
                        let desc = ann.description || '';
                        const originalDesc = desc;

                        // Helper to extract list from text if JSON is empty
                        const extractList = (regex) => {
                            const match = originalDesc.match(regex);
                            if (!match) return [];
                            const items = [];
                            const matches = match[1].matchAll(/-\s*(.+?)\s*\(confidence_score:\s*([\d.]+)\)/gi);
                            for (const m of matches) {
                                items.push({ label: m[1].trim(), confidence_score: parseFloat(m[2]) });
                            }
                            return items;
                        };

                        // Fix detected_objects
                        if ((!ann.detected_objects || ann.detected_objects.length === 0) && originalDesc.includes('detected_objects:')) {
                            const extracted = extractList(/detected_objects:\s*([\s\S]*?)(?=- detected_actions:|- overall_confidence:|$)/i);
                            if (extracted.length > 0) ann.detected_objects = extracted;
                        }

                        // Fix detected_actions
                        if ((!ann.detected_actions || ann.detected_actions.length === 0) && originalDesc.includes('detected_actions:')) {
                            const extracted = extractList(/detected_actions:\s*([\s\S]*?)(?=- overall_confidence:|$)/i);
                            if (extracted.length > 0) ann.detected_actions = extracted;
                        }

                        // Fix scene_classification
                        if (!ann.scene_classification && originalDesc.includes('scene_classification:')) {
                            const match = originalDesc.match(/scene_classification:\s*(.+?)(?=\s*- detected_|$)/i);
                            if (match) ann.scene_classification = match[1].trim();
                        }

                        // Fix overall_confidence
                        if (ann.overall_confidence == null && originalDesc.includes('overall_confidence:')) {
                            const match = originalDesc.match(/overall_confidence:\s*([\d.]+)/i);
                            if (match) ann.overall_confidence = parseFloat(match[1]);
                        }

                        // Fix confidence_score extraction if missing but present in text
                        if (ann.confidence_score == null && originalDesc.includes('confidence_score:')) {
                            const match = originalDesc.match(/confidence_score:\s*([\d.]+)/i);
                            if (match) ann.confidence_score = parseFloat(match[1]);
                        }

                        // Clean description matching the extracted parts
                        if (desc.includes('scene_classification:') || desc.includes('detected_objects:')) {
                            // Keep only the part before the structured block starts
                            const splitPoints = ['- scene_classification:', '- detected_objects:', 'scene_classification:', 'detected_objects:', 'confidence_score:', 'overall_confidence:'];
                            let minIndex = desc.length;
                            splitPoints.forEach(sp => {
                                const idx = desc.indexOf(sp);
                                if (idx !== -1 && idx < minIndex) minIndex = idx;
                            });
                            if (minIndex < desc.length) {
                                ann.description = desc.substring(0, minIndex).trim();
                            }
                        }


                        // Normalize timestamps
                        if (ann.start_timestamp && !ann.timestamp) ann.timestamp = ann.start_timestamp;

                        return ann;
                    });
                }

                // Calculate overall video confidence for status
                // Priority: 1. explicit overall_confidence field on first annotation (if global)
                //           2. average of individual segment confidence_scores
                //           3. default fallback
                let avgConfidence = 0;
                const scores = annotations.map(a => a.confidence_score || a.overall_confidence).filter(s => s != null);
                if (scores.length > 0) {
                    avgConfidence = scores.reduce((a, b) => a + b, 0) / scores.length;
                } else if (annotations.length > 0 && annotations[0].overall_confidence != null) {
                    avgConfidence = annotations[0].overall_confidence;
                }

                // Determine status based on confidence
                const status = avgConfidence >= 0.7 ? 'ready' : 'needs_review';

                // Update UI status immediately
                setVideoStatuses(prev => ({ ...prev, [videoId]: status }));

                // Fallback: parse plain text format from the API if JSON completely failed
                if (annotations.length === 0 && typeof result.data === 'string') {
                    const text = result.data;
                    // Split on "Timestamp:" blocks
                    const blocks = text.split(/(?=Start:|Timestamp:|Time:)/i).filter(b => b.trim().length > 10);

                    for (const block of blocks) {
                        const startMatch = block.match(/(?:Start matches|Start|Timestamp|Time):\s*(\d+:\d+)/i);
                        const endMatch = block.match(/(?:End|To):\s*(\d+:\d+)/i);
                        const descMatch = block.match(/Description:\s*([\s\S]*?)(?=\nScene Classification:|$)/i);
                        const sceneMatch = block.match(/Scene Classification:\s*(.*)/i);
                        const overallMatch = block.match(/Overall Confidence:\s*([\d.]+)/i);

                        // Extract detected objects
                        const objSection = block.match(/Detected Objects:\s*([\s\S]*?)(?=Detected Actions:|Overall Confidence:|Timestamp:|$)/i);
                        const detected_objects = [];
                        if (objSection) {
                            const items = objSection[1].matchAll(/-\s*(.+?)\s*\(confidence_score:\s*([\d.]+)\)/gi);
                            for (const m of items) {
                                detected_objects.push({ label: m[1].trim(), confidence_score: parseFloat(m[2]) });
                            }
                        }

                        // Extract detected actions
                        const actSection = block.match(/Detected Actions:\s*([\s\S]*?)(?=Overall Confidence:|Timestamp:|$)/i);
                        const detected_actions = [];
                        if (actSection) {
                            const items = actSection[1].matchAll(/-\s*(.+?)\s*\(confidence_score:\s*([\d.]+)\)/gi);
                            for (const m of items) {
                                detected_actions.push({ label: m[1].trim(), confidence_score: parseFloat(m[2]) });
                            }
                        }

                        if (startMatch) {
                            annotations.push({
                                timestamp: startMatch[1],
                                start_timestamp: startMatch[1],
                                end_timestamp: endMatch ? endMatch[1] : startMatch[1], // fallback end=start
                                description: descMatch ? descMatch[1].trim() : '',
                                scene_classification: sceneMatch ? sceneMatch[1].trim() : '',
                                detected_objects,
                                detected_actions,
                                overall_confidence: overallMatch ? parseFloat(overallMatch[1]) : null,
                            });
                        }
                    }
                }

                // Store annotation results in state and localStorage
                setAnnotationResults(prev => ({ ...prev, [videoId]: annotations }));

                // Find filename for this video to build localStorage key
                const videoObj = videos.find(v => v.id === videoId);
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
                        avgConfidence // Save this so we don't have to recalc on load if we don't want to
                    }));
                } catch (e) {
                    console.warn('Failed to save annotations to localStorage:', e);
                }

            } catch (err) {
                console.error(`Annotation failed for ${videoId}:`, err);
                setVideoStatuses(prev => ({ ...prev, [videoId]: 'needs_review' }));
            }
        }

        setAnnotating(false);
    }, [selectedIds, domainLabels, annotationDensity, buildAnalyzeSchema, videos, decodedName]);

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

    // Trigger analysis once videos are loaded
    useEffect(() => {
        if (videos.length > 0 && !suggestedClasses && !analyzingClasses) {
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
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4 cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
                        Back to Indexes
                    </button>

                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                                {decodedName}
                            </h1>

                            {indexDescription && (
                                <p className="text-sm text-[var(--text-secondary)] mt-1.5 max-w-2xl">
                                    {indexDescription}
                                </p>
                            )}

                            <p className="text-xs text-[var(--text-tertiary)] mt-2">
                                {loading
                                    ? 'Loading videos…'
                                    : `${videos.length} video${videos.length !== 1 ? 's' : ''} in this index`}
                            </p>
                        </div>

                        {/* Header actions */}
                        {!loading && (
                            <div className="flex items-center gap-3 shrink-0">
                                {/* Semantic Search Bar */}
                                <div className={`relative transition-all duration-300 ease-in-out ${isSearchExpanded ? 'w-64 md:w-96' : 'w-40 md:w-48'}`}>
                                    <div className={`
                                        absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors
                                        ${isSearchExpanded ? 'text-primary-500' : 'text-[var(--text-tertiary)]'}
                                    `}>
                                        <Search className="w-4 h-4" strokeWidth={isSearchExpanded ? 2 : 1.5} />
                                    </div>
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onFocus={() => setIsSearchExpanded(true)}
                                        onBlur={() => !search && setIsSearchExpanded(false)}
                                        placeholder={isSearchExpanded ? "Search specific moments, objects..." : "Semantic Search..."}
                                        className={`
                                            w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all
                                            border bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]
                                            focus:outline-none focus:ring-2 focus:ring-primary-400/20
                                            ${isSearchExpanded
                                                ? 'border-primary-500 shadow-lg shadow-primary-500/10'
                                                : 'border-[var(--border)] hover:border-[var(--text-secondary)]'}
                                        `}
                                    />
                                    {search && (
                                        <button
                                            onClick={() => { setSearch(''); setIsSearchExpanded(false); }}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {/* Download Annotations */}
                                <div className="relative group/dl">
                                    <button
                                        disabled={Object.keys(videoStatuses).length === 0}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${Object.keys(videoStatuses).length > 0
                                            ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 cursor-pointer'
                                            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        <Download className="w-4 h-4" strokeWidth={2} />
                                        <span className="hidden md:inline">Download</span>
                                    </button>
                                    {Object.keys(videoStatuses).length === 0 && (
                                        <div className="absolute right-0 top-full mt-2 px-3 py-2 rounded-lg bg-gray-900 dark:bg-gray-800 shadow-lg border border-gray-700 whitespace-nowrap pointer-events-none opacity-0 group-hover/dl:opacity-100 transition-opacity duration-200 z-30">
                                            <p className="text-xs text-gray-300">Annotate at least one video first</p>
                                            <div className="absolute -top-1 right-4 w-2 h-2 rotate-45 bg-gray-900 dark:bg-gray-800 border-l border-t border-gray-700" />
                                        </div>
                                    )}
                                </div>

                                {/* Upload Videos */}
                                <button
                                    onClick={() => setUploadModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-900 cursor-pointer hover:brightness-95 transition-all"
                                    style={{ background: 'linear-gradient(135deg, #D9F99D 0%, #FDE047 100%)' }}
                                >
                                    <Plus className="w-4 h-4" strokeWidth={2} />
                                    <span className="hidden md:inline">Upload</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Navigation Tabs */}
                    {!loading && (
                        <div className="flex items-center gap-6 mt-6 border-b border-[var(--border)]">
                            <button
                                onClick={() => setActiveTab('library')}
                                className={`flex items-center gap-2 pb-3 text-sm font-medium transition-all relative ${activeTab === 'library'
                                    ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                                    }`}
                            >
                                <LayoutGrid className="w-4 h-4" strokeWidth={2} />
                                Library
                                {activeTab === 'library' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-t-full" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('embeddings')}
                                className={`flex items-center gap-2 pb-3 text-sm font-medium transition-all relative ${activeTab === 'embeddings'
                                    ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                                    }`}
                            >
                                <Database className="w-4 h-4" strokeWidth={2} />
                                Embeddings
                                {activeTab === 'embeddings' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-t-full" />
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
                            <div className="mb-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                                {/* Header */}
                                <div className="px-5 pt-5 pb-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
                                            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                                                Label Taxonomy
                                            </h2>
                                            {domainLabels.size > 0 && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--background)] text-[var(--text-tertiary)] font-mono">
                                                    {domainLabels.size}
                                                </span>
                                            )}
                                        </div>
                                        {suggestedClasses && (
                                            <button
                                                onClick={() => { setSuggestedClasses(null); runAnalysis(videos[0]?.id); }}
                                                disabled={analyzingClasses}
                                                className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer disabled:opacity-50"
                                            >
                                                <RefreshCw className={`w-3 h-3 ${analyzingClasses ? 'animate-spin' : ''}`} strokeWidth={2} />
                                                Re-analyze
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-[var(--text-tertiary)]">
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
                                            className="w-full pl-3 pr-10 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition"
                                        />
                                        {labelInput.trim() && (
                                            <button
                                                onClick={() => { addLabel(labelInput); setLabelInput(''); }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                            >
                                                <Plus className="w-4 h-4 text-primary-500" strokeWidth={2} />
                                            </button>
                                        )}
                                    </div>

                                    {domainLabels.size > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {[...domainLabels].map((label) => (
                                                <span
                                                    key={label}
                                                    className="group/chip flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-primary-500/15 text-primary-600 dark:text-primary-400 border border-primary-500/25 transition-colors"
                                                >
                                                    {label}
                                                    <button
                                                        onClick={() => removeLabel(label)}
                                                        className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                                                    >
                                                        <X className="w-3 h-3 text-primary-400 group-hover/chip:text-red-500" strokeWidth={2} />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-[var(--text-tertiary)] italic">
                                            No labels yet — add from AI suggestions below or type your own above.
                                        </p>
                                    )}
                                </div>

                                {/* Divider + AI suggestions */}
                                {(suggestedClasses || analyzingClasses || analyzeError) && (
                                    <div className="border-t border-[var(--border)] bg-[var(--background)]/50 px-5 py-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Sparkles className="w-3.5 h-3.5 text-primary-500" strokeWidth={1.5} />
                                            <span className="text-xs font-medium text-[var(--text-secondary)]">
                                                AI Suggestions
                                            </span>
                                            <span className="text-[10px] text-[var(--text-tertiary)]">
                                                powered by TwelveLabs Pegasus
                                            </span>
                                        </div>

                                        {analyzingClasses && (
                                            <div className="flex items-center gap-3 py-2">
                                                <Loader2 className="w-4 h-4 text-primary-500 animate-spin" strokeWidth={2} />
                                                <span className="text-sm text-[var(--text-secondary)]">Analyzing video content…</span>
                                            </div>
                                        )}

                                        {analyzeError && (
                                            <div className="flex items-center justify-between py-2">
                                                <span className="text-sm text-red-500 dark:text-red-400">Failed to analyze: {analyzeError}</span>
                                                <button
                                                    onClick={() => runAnalysis(videos[0]?.id)}
                                                    className="text-xs font-medium text-primary-500 hover:text-primary-400 cursor-pointer"
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
                                                                ? 'bg-primary-500 text-gray-900 border-primary-500'
                                                                : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-primary-400 hover:text-primary-500'
                                                                }`}
                                                        >
                                                            {isAdded ? (
                                                                <>
                                                                    <span>✓</span>
                                                                    {cls}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <PlusCircle className="w-3 h-3" strokeWidth={2} />
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
                                <Loader2 className="w-6 h-6 text-[var(--text-tertiary)] animate-spin" strokeWidth={1.5} />
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
                            />
                        )}
                    </>
                )}

                {/* Embeddings Tab Content */}
                {activeTab === 'embeddings' && (
                    <EmbeddingsView videos={videos} />
                )}
            </main>

            {/* Sticky annotate bar */}
            {selectedStats.count > 0 && (
                <div className="fixed bottom-0 left-0 lg:left-60 right-0 z-30 bg-[var(--surface)] border-t border-[var(--border)] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] animate-fade-in">
                    {/* Settings row */}
                    <div className="border-b border-[var(--border)] px-4 lg:px-6 py-3">
                        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
                            {/* Annotation density */}
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                                    Annotation Density
                                </span>
                                <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
                                    <button
                                        onClick={() => setAnnotationDensity('scene')}
                                        className={`px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${annotationDensity === 'scene'
                                            ? 'bg-primary-500/20 text-[var(--text-primary)] border-r border-[var(--border)]'
                                            : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-gray-50 dark:hover:bg-gray-800 border-r border-[var(--border)]'
                                            }`}
                                    >
                                        Scene-level
                                        <span className="ml-1 text-[10px] text-[var(--text-tertiary)]">10-30s</span>
                                    </button>
                                    <button
                                        onClick={() => setAnnotationDensity('action')}
                                        className={`px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${annotationDensity === 'action'
                                            ? 'bg-primary-500/20 text-[var(--text-primary)]'
                                            : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        Action-level
                                        <span className="ml-1 text-[10px] text-[var(--text-tertiary)]">2-5s</span>
                                    </button>
                                </div>
                            </div>

                            {/* ROI stats */}
                            <div className="flex items-center gap-3 text-xs">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[var(--text-tertiary)]">Manual:</span>
                                    <span className="font-mono font-medium text-red-500 dark:text-red-400">
                                        {formatDuration(roiStats.manualTimeSec)}
                                    </span>
                                </div>
                                <span className="text-[var(--text-tertiary)]">→</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[var(--text-tertiary)]">TwelveLabs:</span>
                                    <span className="font-mono font-medium text-green-600 dark:text-green-400">
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
                                    <span className="text-sm font-medium text-[var(--text-primary)]">
                                        {selectedStats.count} video{selectedStats.count !== 1 ? 's' : ''} selected
                                    </span>
                                    <span className="text-xs text-[var(--text-tertiary)] font-mono">
                                        {formatDuration(selectedStats.totalDuration)}
                                    </span>
                                </div>
                                <div className="h-4 w-px bg-[var(--border)]" />
                                <div className="flex items-center gap-2.5 text-xs">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[var(--text-tertiary)]">Human:</span>
                                        <span className="font-mono font-semibold text-red-500 dark:text-red-400">
                                            ${roiStats.humanCost.toFixed(2)}
                                        </span>
                                    </div>
                                    <span className="text-[var(--text-tertiary)]">→</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[var(--text-tertiary)]">TwelveLabs:</span>
                                        <span className="font-mono font-semibold text-green-600 dark:text-green-400">
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
                                style={{ background: 'linear-gradient(135deg, #D9F99D 0%, #FDE047 100%)' }}
                            >
                                {annotating ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                                        Annotating…
                                    </span>
                                ) : (
                                    <>Annotate {selectedStats.count} Video{selectedStats.count !== 1 ? 's' : ''}</>
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
                presetIndexName={decodedName}
                presetDescription={indexDescription}
            />
        </div>
    );
}
