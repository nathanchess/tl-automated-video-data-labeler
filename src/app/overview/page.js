'use client';

import Sidebar from '@/components/dashboard/Sidebar';
import { highlightCode } from '@/lib/vscodeHighlight';
import {
    ArrowRightIcon,
    RocketIcon,
    VideoIcon,
    EntityIcon,
    SearchIcon,
    ServersIcon,
    DownloadIcon,
    ArrowDiagonalIcon,
    ApiDocIcon,
    CodeSnippetIcon,
    UsageIcon,
    ScalableIcon,
    HistoryIcon,
    BillingIcon,
    MarengoIcon,
    AppsIcon,
    IntegrationIcon,
    ChevronRightIcon,
} from '@twelvelabs-io/react';

/* ---------- VS Code Dark+ code block ---------- */
function CodeBlock({ title, language = 'javascript', children }) {
    const code = typeof children === 'string' ? children : String(children ?? '');
    const html = highlightCode(code, language);

    return (
        <div className="vscode-code my-6 overflow-hidden rounded-xl border border-border-secondary">
            {title && (
                <div className="flex items-center gap-2 border-b border-white/10 bg-[#252526] px-4 py-2.5">
                    <div className="flex gap-1.5">
                        <span className="size-3 rounded-full bg-[#f14c4c]" />
                        <span className="size-3 rounded-full bg-[#cca700]" />
                        <span className="size-3 rounded-full bg-[#23d18b]" />
                    </div>
                    <span className="ml-2 font-tl-mono text-xs text-[#cccccc]">{title}</span>
                    {language && (
                        <span className="ml-auto font-tl-mono text-[10px] uppercase text-[#858585]">
                            {language}
                        </span>
                    )}
                </div>
            )}
            <pre className="overflow-x-auto p-4 font-tl-mono text-[13px] leading-relaxed">
                <code dangerouslySetInnerHTML={{ __html: html }} />
            </pre>
        </div>
    );
}

/* ---------- section divider ---------- */
function Divider() {
    return (
        <div className="my-12 flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border-secondary to-transparent" />
            <img src="/TwelveLabs-Symbol.png" alt="" className="w-6 h-6 rounded opacity-40" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border-secondary to-transparent" />
        </div>
    );
}

/* ---------- feature card ---------- */
function FeatureCard({ icon: Icon, title, description, color }) {
    return (
        <div className="group rounded-2xl border border-border-secondary bg-surface-white p-5 hover:border-border-secondary transition-all duration-200 hover:shadow-lg">
            <div className={`inline-flex p-2.5 rounded-xl mb-3 ${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-foreground-body mb-1.5">{title}</h3>
            <p className="text-xs text-foreground-secondary leading-relaxed">{description}</p>
        </div>
    );
}

/* ---------- stat card ---------- */
function StatCard({ value, label, icon: Icon }) {
    return (
        <div className="flex items-center gap-4 rounded-xl border border-border-secondary bg-surface-white p-4">
            <div className="p-2 rounded-lg bg-tl-master-brand-green/10">
                <Icon className="w-4 h-4 text-tl-master-brand-green" />
            </div>
            <div>
                <p className="text-xl font-bold text-foreground-body">{value}</p>
                <p className="text-xs text-foreground-subtle">{label}</p>
            </div>
        </div>
    );
}

export default function OverviewPage() {
    return (
        <div className="flex min-h-screen">
            <Sidebar />

            <main className="flex-1 lg:ml-60 p-4 lg:p-8">
                <article className="max-w-4xl mx-auto">

                    {/* ───── Hero ───── */}
                    <header className="mb-12">
                        <div className="flex items-center gap-3 mb-4">
                            <img src="/TwelveLabs-Symbol.png" alt="TwelveLabs" className="w-10 h-10 rounded-xl" />
                            <span className="text-xs font-semibold text-tl-master-brand-green uppercase tracking-widest">
                                Documentation • Guide
                            </span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-foreground-body leading-tight mb-4">
                            Automated Video Data Labeler
                        </h1>
                        <p className="text-lg text-foreground-secondary leading-relaxed max-w-2xl">
                            Replace hours of manual video annotation with AI-powered labeling.
                            Upload raw footage, let TwelveLabs' multimodal models generate structured training data,
                            and export production-ready datasets — all from a single dashboard.
                        </p>

                        <div className="flex flex-wrap gap-3 mt-6">
                            <a
                                href="https://docs.twelvelabs.io/docs/get-started/introduction"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-900 transition-all hover:brightness-95"
                                style={{ background: 'linear-gradient(135deg, var(--tl-color-master-brand-green) 0%, var(--tl-color-master-brand-orange) 100%)' }}
                            >
                                <ApiDocIcon className="w-4 h-4" />
                                Read the Docs
                                <ArrowDiagonalIcon className="w-3 h-3 opacity-60" />
                            </a>
                            <a
                                href="https://github.com/nathanchess/tl-automated-video-data-labeler"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all"
                            >
                                <CodeSnippetIcon className="w-4 h-4" />
                                View Source
                                <ArrowDiagonalIcon className="w-3 h-3 opacity-60" />
                            </a>
                            <a
                                href="https://www.twelvelabs.io/contact"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-border-secondary text-foreground-secondary hover:text-foreground-body hover:border-border-secondary transition-all"
                            >
                                Talk to Sales
                                <ArrowRightIcon className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </header>

                    {/* ───── Architecture / Demo Placeholders ───── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                        <div className="rounded-2xl border border-border-secondary overflow-hidden bg-surface-white">
                            <img src="/architecture.jpeg" alt="Architecture Diagram" className="w-full h-auto" />
                        </div>
                        <div className="rounded-2xl border border-border-secondary overflow-hidden bg-surface-white">
                            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                <iframe
                                    className="absolute top-0 left-0 w-full h-full"
                                    src="https://www.youtube.com/embed/lZkDvpmez7A?si=PYCxFMCEpCNd6sEM"
                                    title="YouTube video player"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                    referrerPolicy="strict-origin-when-cross-origin"
                                    allowFullScreen
                                />
                            </div>
                        </div>
                    </div>

                    <Divider />

                    {/* ───── The Problem ───── */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-foreground-body mb-4">
                            The Data Labeling Bottleneck
                        </h2>
                        <p className="text-sm text-foreground-secondary leading-relaxed mb-4">
                            In computer vision, video data is abundant — thousands of terabytes flow through IP-based camera networks daily.
                            But <strong className="text-foreground-body">labeled</strong> video data? That's the bottleneck. Manually scrubbing through
                            hours of footage to find a specific event — a forklift violation, a safety breach, a product defect — is prohibitively expensive.
                            Companies spend an estimated <strong className="text-foreground-body">$25–$50 per hour</strong> on human annotators,
                            leading to the rise of expensive services like AWS SageMaker Ground Truth and other data labeling vendors.
                        </p>
                        <p className="text-sm text-foreground-secondary leading-relaxed">
                            Breakthroughs in <strong className="text-foreground-body">semantic video understanding</strong> allow us to invert
                            this workflow entirely. Instead of manually hunting for events, we treat video as data that can be queried, clustered,
                            and auto-labeled. This isn't just a time-saver — it's a <strong className="text-foreground-body">force multiplier</strong> for
                            deploying Vision Language Models (VLLMs) in production environments.
                        </p>
                    </section>

                    {/* ───── Business Impact Stats ───── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
                        <StatCard value="97%" label="Faster than manual" icon={HistoryIcon} />
                        <StatCard value="90%+" label="Cost reduction" icon={BillingIcon} />
                        <StatCard value="3 formats" label="JSON, CSV, COCO" icon={DownloadIcon} />
                        <StatCard value="512-dim" label="Marengo embeddings" icon={MarengoIcon} />
                    </div>

                    <Divider />

                    {/* ───── Core Features ───── */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-foreground-body mb-2">
                            Core Features
                        </h2>
                        <p className="text-sm text-foreground-secondary mb-6">
                            Everything you need to go from raw footage to training-ready datasets.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FeatureCard
                                icon={VideoIcon}
                                title="Video Index Management"
                                description="Upload videos into named indexes. Organize datasets by project, domain, or experiment. Track video count, duration, and status at a glance."
                                color="text-foreground-embed bg-surface-embed"
                            />
                            <FeatureCard
                                icon={EntityIcon}
                                title="AI-Powered Annotation"
                                description="Define custom label taxonomies, then let TwelveLabs generate frame-accurate annotations with timestamps, descriptions, and confidence scores."
                                color="text-foreground-analyze bg-surface-analyze"
                            />
                            <FeatureCard
                                icon={SearchIcon}
                                title="Semantic Video Search"
                                description="Search for specific moments across your entire video library using natural language queries. No keywords needed — search by meaning."
                                color="text-foreground-search bg-surface-search"
                            />
                            <FeatureCard
                                icon={ServersIcon}
                                title="Embedding Visualization"
                                description="Visualize 512-dimensional Marengo embeddings projected into 2D space via PCA. See how your videos cluster by semantic similarity."
                                color="text-tl-master-brand-dark-green bg-tl-master-brand-lightest-emeraldgreen"
                            />
                            <FeatureCard
                                icon={DownloadIcon}
                                title="Multi-Format Export"
                                description="Download annotations as JSON for raw access, CSV for spreadsheets, or COCO format for direct use in object detection pipelines."
                                color="text-tl-master-brand-dark-orange bg-tl-master-brand-lightest-orange"
                            />
                            <FeatureCard
                                icon={UsageIcon}
                                title="ROI Calculator"
                                description="See real-time cost and time comparisons between manual annotation and TwelveLabs-powered labeling for your selected videos."
                                color="text-tl-master-brand-dark-peach bg-tl-master-brand-lightest-peach"
                            />
                        </div>
                    </section>

                    <Divider />

                    {/* ───── How It Works ───── */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-foreground-body mb-2">
                            How It Works
                        </h2>
                        <p className="text-sm text-foreground-secondary mb-8">
                            A three-step pipeline from raw video to training-ready dataset.
                        </p>

                        {/* Step 1 */}
                        <div className="mb-10">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                                    style={{ background: 'linear-gradient(135deg, var(--tl-color-master-brand-green) 0%, var(--tl-color-master-brand-orange) 100%)', color: '#1a1a1a' }}>
                                    1
                                </span>
                                <h3 className="text-lg font-semibold text-foreground-body">
                                    Upload & Index Videos
                                </h3>
                            </div>
                            <p className="text-sm text-foreground-secondary leading-relaxed mb-3 ml-10">
                                Videos are uploaded to TwelveLabs via the <code className="px-1.5 py-0.5 rounded bg-surface-card text-xs font-tl-mono text-tl-master-brand-green">tasks.create()</code> API.
                                Each video is processed through the Marengo 3.0 engine, which generates multimodal embeddings
                                encoding visual, audio, and textual content into a 512-dimensional vector space.
                            </p>
                            <CodeBlock title="route.js — Video ingestion" language="javascript">
                                {`const task = await tl_client.tasks.create({
    indexId: indexId,
    videoUrl: videoURL,
    userMetadata: JSON.stringify({
        indexName: "Autonomous Driving",
        description: "Dashcam footage for perception model training"
    })
});

// Wait for TwelveLabs to finish processing
const completed = await tl_client.tasks.waitForDone(task.id, {
    sleepInterval: 5
});

console.log(\`Video \${completed.videoId} indexed successfully\`);`}
                            </CodeBlock>
                        </div>

                        {/* Step 2 */}
                        <div className="mb-10">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                                    style={{ background: 'linear-gradient(135deg, var(--tl-color-master-brand-green) 0%, var(--tl-color-master-brand-orange) 100%)', color: '#1a1a1a' }}>
                                    2
                                </span>
                                <h3 className="text-lg font-semibold text-foreground-body">
                                    Auto-Annotate with Custom Labels
                                </h3>
                            </div>
                            <p className="text-sm text-foreground-secondary leading-relaxed mb-3 ml-10">
                                Define your domain-specific label taxonomy (e.g., <em>"car_turning_left"</em>, <em>"pedestrian_crossing"</em>),
                                then trigger automated annotation. The system uses TwelveLabs' generative video understanding to produce
                                frame-accurate labels with precise start and end timestamps.
                            </p>
                            <CodeBlock title="Annotation prompt construction" language="javascript">
                                {`const prompt = \`Analyze this video and generate annotations.
For each distinct event, provide:
- label: one of [\${domainLabels.join(', ')}]
- start_timestamp: exact seconds when the event begins
- end_timestamp: exact seconds when the event ends
- description: brief description of what's happening

Return as JSON array.\`;

const response = await fetch('/api/annotate', {
    method: 'POST',
    body: JSON.stringify({ videoId, prompt })
});`}
                            </CodeBlock>
                        </div>

                        {/* Step 3 */}
                        <div className="mb-10">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                                    style={{ background: 'linear-gradient(135deg, var(--tl-color-master-brand-green) 0%, var(--tl-color-master-brand-orange) 100%)', color: '#1a1a1a' }}>
                                    3
                                </span>
                                <h3 className="text-lg font-semibold text-foreground-body">
                                    Export & Train
                                </h3>
                            </div>
                            <p className="text-sm text-foreground-secondary leading-relaxed mb-3 ml-10">
                                Download your annotations in the format your ML pipeline expects.
                                The COCO export includes category mappings and bounding box placeholders, making it ready for
                                fine-tuning object detection or action recognition models.
                            </p>
                            <CodeBlock title="COCO format export" language="json">
                                {`{
  "info": {
    "description": "Autonomous Driving Dataset",
    "date_created": "2026-02-15T00:00:00Z"
  },
  "videos": [
    { "id": 1, "file_name": "dashcam_001.mp4", "duration": 124.5 }
  ],
  "annotations": [
    {
      "id": 1,
      "video_id": 1,
      "category_id": 3,
      "start": 12.4,
      "end": 15.8,
      "description": "Vehicle executing left turn at intersection"
    }
  ],
  "categories": [
    { "id": 1, "name": "pedestrian_crossing" },
    { "id": 2, "name": "lane_change" },
    { "id": 3, "name": "car_turning_left" }
  ]
}`}
                            </CodeBlock>
                        </div>
                    </section>

                    <Divider />

                    {/* ───── Embedding Visualization ───── */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-foreground-body mb-2">
                            Understanding Your Data Through Embeddings
                        </h2>
                        <p className="text-sm text-foreground-secondary leading-relaxed mb-4">
                            Every video indexed by TwelveLabs is represented as a <strong className="text-foreground-body">512-dimensional embedding vector</strong> generated
                            by the Marengo 3.0 model. These vectors capture the semantic meaning of video content across visual, audio, and textual modalities.
                        </p>
                        <p className="text-sm text-foreground-secondary leading-relaxed mb-4">
                            The Embeddings tab in each index uses <strong className="text-foreground-body">Principal Component Analysis (PCA)</strong> to project
                            these high-dimensional vectors into 2D space. Videos that are semantically similar to each other appear as clusters —
                            giving you an intuitive way to audit data quality, identify duplicates, and discover patterns before training.
                        </p>
                        <CodeBlock title="Custom power-iteration PCA (runs in-browser)" language="javascript">
                            {`// Build N×N gram matrix instead of dim×dim covariance
// This keeps computation O(N³) instead of O(dim³ = 512³)
const gram = Array.from({ length: N }, (_, i) =>
    Array.from({ length: N }, (_, j) =>
        centered[i].reduce((s, v, k) => s + v * centered[j][k], 0)
    )
);

// Power iteration to find top-2 eigenvectors
let v = Array.from({ length: N }, () => Math.random() - 0.5);
for (let iter = 0; iter < 100; iter++) {
    const next = gram.map(row =>
        row.reduce((s, g, j) => s + g * v[j], 0)
    );
    const norm = Math.sqrt(next.reduce((s, x) => s + x * x, 0));
    v = next.map(x => x / norm);
}`}
                        </CodeBlock>
                    </section>

                    <Divider />

                    {/* ───── Why TwelveLabs ───── */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-foreground-body mb-2">
                            Why TwelveLabs?
                        </h2>
                        <p className="text-sm text-foreground-secondary leading-relaxed mb-6">
                            TwelveLabs provides the foundational video understanding models that power every feature in this application.
                        </p>

                        <div className="rounded-2xl border border-border-secondary bg-surface-white overflow-hidden">
                            {[
                                {
                                    icon: MarengoIcon,
                                    title: 'Marengo 3.0 — Multimodal Embeddings',
                                    desc: 'State-of-the-art video representation model that encodes visual, audio, and textual content into a unified 512-dimensional vector space. Powers semantic search, clustering, and similarity detection.',
                                },
                                {
                                    icon: RocketIcon,
                                    title: 'Pegasus 1.2 — Generative Video Understanding',
                                    desc: 'Generates structured, human-readable descriptions and labels from video content. Understands temporal relationships, object interactions, and scene transitions with frame-level accuracy.',
                                },
                                {
                                    icon: ScalableIcon,
                                    title: 'Enterprise-Grade Infrastructure',
                                    desc: 'SOC 2 compliant, built for scale. Process thousands of hours of video through a simple REST API with consistent, predictable pricing and 99.9% uptime.',
                                },
                                {
                                    icon: IntegrationIcon,
                                    title: 'Research-Backed Innovation',
                                    desc: 'TwelveLabs\' research team publishes cutting-edge work on video understanding, continuously improving model accuracy and expanding capabilities into new domains.',
                                },
                            ].map(({ icon: Ic, title, desc }, i) => (
                                <div
                                    key={i}
                                    className={`flex items-start gap-4 p-5 ${i > 0 ? 'border-t border-border-secondary' : ''}`}
                                >
                                    <div className="p-2 rounded-xl bg-tl-master-brand-green/10 shrink-0">
                                        <Ic className="w-5 h-5 text-tl-master-brand-green" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground-body mb-1">{title}</h4>
                                        <p className="text-xs text-foreground-secondary leading-relaxed">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <Divider />

                    {/* ───── ROI Section ───── */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-foreground-body mb-2">
                            From Curated Data to Business Impact
                        </h2>
                        <p className="text-sm text-foreground-secondary leading-relaxed mb-6">
                            The output of this tool — structured, labeled datasets — is not just a file; it's an actionable asset that
                            drives business intelligence and model performance.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="rounded-2xl border border-border-secondary bg-surface-white p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <RocketIcon className="w-4 h-4 text-yellow-500" />
                                    <h3 className="text-sm font-semibold text-foreground-body">Accelerating VLLM Fine-Tuning</h3>
                                </div>
                                <ul className="space-y-2">
                                    <li className="text-xs text-foreground-secondary leading-relaxed flex items-start gap-2">
                                        <ChevronRightIcon className="w-3 h-3 text-tl-master-brand-green mt-0.5 shrink-0" />
                                        <span><strong className="text-foreground-body">Skip Feature Extraction</strong> — Pre-computed embeddings mean you can train a classifier in seconds, not hours.</span>
                                    </li>
                                    <li className="text-xs text-foreground-secondary leading-relaxed flex items-start gap-2">
                                        <ChevronRightIcon className="w-3 h-3 text-tl-master-brand-green mt-0.5 shrink-0" />
                                        <span><strong className="text-foreground-body">Reduce Hallucinations</strong> — Curated data ensures your model learns from distinct, well-separated examples.</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="rounded-2xl border border-border-secondary bg-surface-white p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <UsageIcon className="w-4 h-4 text-blue-500" />
                                    <h3 className="text-sm font-semibold text-foreground-body">Operational Intelligence</h3>
                                </div>
                                <ul className="space-y-2">
                                    <li className="text-xs text-foreground-secondary leading-relaxed flex items-start gap-2">
                                        <ChevronRightIcon className="w-3 h-3 text-tl-master-brand-green mt-0.5 shrink-0" />
                                        <span><strong className="text-foreground-body">Heatmap of Hazards</strong> — Clustering reveals systemic operational failures, not just one-off events.</span>
                                    </li>
                                    <li className="text-xs text-foreground-secondary leading-relaxed flex items-start gap-2">
                                        <ChevronRightIcon className="w-3 h-3 text-tl-master-brand-green mt-0.5 shrink-0" />
                                        <span><strong className="text-foreground-body">Trend Analysis</strong> — Track if specific violation clusters are growing or shrinking over time.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <Divider />

                    {/* ───── Tech Stack ───── */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-foreground-body mb-4">
                            Technology Stack
                        </h2>
                        <div className="rounded-2xl border border-border-secondary bg-surface-white overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border-secondary bg-surface-card">
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-subtle uppercase tracking-wider">Layer</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-subtle uppercase tracking-wider">Technology</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-foreground-subtle uppercase tracking-wider">Purpose</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-secondary">
                                    {[
                                        ['Frontend', 'Next.js 16 + React 19', 'Server-side rendering, routing, and UI'],
                                        ['Video AI', 'TwelveLabs API', 'Embeddings (Marengo), annotations (Pegasus)'],
                                        ['Styling', 'Tailwind CSS', 'Utility-first responsive design'],
                                        ['Visualization', 'Canvas 2D + Custom PCA', 'Embedding scatter plots with power iteration'],
                                        ['Storage', 'Vercel Blob', 'Video file hosting before indexing'],
                                        ['Export', 'Client-side generation', 'JSON, CSV, and COCO format downloads'],
                                    ].map(([layer, tech, purpose], i) => (
                                        <tr key={i} className="hover:bg-gray-50 hover:bg-surface-card transition-colors">
                                            <td className="px-5 py-3 font-medium text-foreground-body">{layer}</td>
                                            <td className="px-5 py-3 font-tl-mono text-xs text-tl-master-brand-green">{tech}</td>
                                            <td className="px-5 py-3 text-foreground-secondary text-xs">{purpose}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <Divider />

                    {/* ───── CTA Footer ───── */}
                    <section className="mb-16">
                        <div className="rounded-2xl p-8 text-center" style={{ background: 'linear-gradient(135deg, rgba(217,249,157,0.15) 0%, rgba(253,224,71,0.15) 100%)' }}>
                            <h2 className="text-xl font-bold text-foreground-body mb-2">
                                Ready to automate your video annotation?
                            </h2>
                            <p className="text-sm text-foreground-secondary mb-6 max-w-lg mx-auto">
                                Get started with the API documentation, explore the source code, or talk to our team about
                                enterprise deployment options.
                            </p>
                            <div className="flex flex-wrap justify-center gap-3">
                                <a
                                    href="https://docs.twelvelabs.io/docs/get-started/introduction"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-900 transition-all hover:brightness-95"
                                    style={{ background: 'linear-gradient(135deg, var(--tl-color-master-brand-green) 0%, var(--tl-color-master-brand-orange) 100%)' }}
                                >
                                    <ApiDocIcon className="w-4 h-4" />
                                    API Documentation
                                </a>
                                <a
                                    href="https://www.twelvelabs.io/research"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all"
                                >
                                    Research Papers
                                    <ArrowDiagonalIcon className="w-3 h-3 opacity-60" />
                                </a>
                                <a
                                    href="https://www.twelvelabs.io/contact"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-border-secondary text-foreground-secondary hover:text-foreground-body hover:border-border-secondary transition-all"
                                >
                                    Talk to Sales
                                    <ArrowRightIcon className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>
                    </section>

                    {/* ───── Footer ───── */}
                    <footer className="pb-8 text-center">
                        <p className="text-xs text-foreground-subtle">
                            Built by{' '}
                            <a href="https://github.com/nathanchess" target="_blank" rel="noopener noreferrer" className="text-foreground-secondary hover:text-foreground-body transition-colors">
                                Nathan Che
                            </a>
                            {' '}• Powered by{' '}
                            <a href="https://www.twelvelabs.io" target="_blank" rel="noopener noreferrer" className="text-foreground-secondary hover:text-foreground-body transition-colors">
                                TwelveLabs
                            </a>
                        </p>
                    </footer>

                </article>
            </main>
        </div>
    );
}
