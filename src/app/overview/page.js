'use client';

import Sidebar from '@/components/dashboard/Sidebar';
import {
    ArrowRight,
    Zap,
    Video,
    Tag,
    Search,
    Database,
    Download,
    ExternalLink,
    BookOpen,
    Code2,
    BarChart3,
    Shield,
    Clock,
    DollarSign,
    Cpu,
    Layers,
    GitBranch,
    ChevronRight,
} from 'lucide-react';

/* ---------- tiny reusable code block component ---------- */
function CodeBlock({ title, language, children }) {
    return (
        <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[#1e1e2e] my-6">
            {title && (
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/[0.02]">
                    <div className="flex gap-1.5">
                        <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                        <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                        <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                    </div>
                    <span className="text-xs text-gray-400 font-mono ml-2">{title}</span>
                    {language && (
                        <span className="ml-auto text-[10px] text-gray-500 font-mono uppercase">{language}</span>
                    )}
                </div>
            )}
            <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono">
                <code className="text-gray-300">{children}</code>
            </pre>
        </div>
    );
}

/* ---------- section divider ---------- */
function Divider() {
    return (
        <div className="my-12 flex items-center gap-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
            <img src="/TwelveLabs-Symbol.png" alt="" className="w-6 h-6 rounded opacity-40" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
        </div>
    );
}

/* ---------- feature card ---------- */
function FeatureCard({ icon: Icon, title, description, color }) {
    return (
        <div className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-[var(--text-secondary)] transition-all duration-200 hover:shadow-lg">
            <div className={`inline-flex p-2.5 rounded-xl mb-3 ${color}`}>
                <Icon className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1.5">{title}</h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{description}</p>
        </div>
    );
}

/* ---------- stat card ---------- */
function StatCard({ value, label, icon: Icon }) {
    return (
        <div className="flex items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="p-2 rounded-lg bg-primary-500/10">
                <Icon className="w-4 h-4 text-primary-500" strokeWidth={2} />
            </div>
            <div>
                <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{label}</p>
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
                            <span className="text-xs font-semibold text-primary-500 uppercase tracking-widest">
                                Documentation • Guide
                            </span>
                        </div>
                        <h1 className="text-3xl lg:text-4xl font-bold text-[var(--text-primary)] leading-tight mb-4">
                            Automated Video Data Labeler
                        </h1>
                        <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl">
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
                                style={{ background: 'linear-gradient(135deg, #D9F99D 0%, #FDE047 100%)' }}
                            >
                                <BookOpen className="w-4 h-4" strokeWidth={2} />
                                Read the Docs
                                <ExternalLink className="w-3 h-3 opacity-60" />
                            </a>
                            <a
                                href="https://github.com/nathanchess/tl-automated-video-data-labeler"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all"
                            >
                                <Code2 className="w-4 h-4" strokeWidth={2} />
                                View Source
                                <ExternalLink className="w-3 h-3 opacity-60" />
                            </a>
                            <a
                                href="https://www.twelvelabs.io/contact"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-all"
                            >
                                Talk to Sales
                                <ArrowRight className="w-3.5 h-3.5" />
                            </a>
                        </div>
                    </header>

                    {/* ───── Architecture / Demo Placeholders ───── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-gray-50 dark:bg-gray-800/30 p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
                            <Layers className="w-8 h-8 text-[var(--text-tertiary)] mb-3" strokeWidth={1.5} />
                            <p className="text-sm font-medium text-[var(--text-secondary)]">Architecture Diagram</p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-1">To be added</p>
                        </div>
                        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-gray-50 dark:bg-gray-800/30 p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
                            <Video className="w-8 h-8 text-[var(--text-tertiary)] mb-3" strokeWidth={1.5} />
                            <p className="text-sm font-medium text-[var(--text-secondary)]">Demo Video</p>
                            <p className="text-xs text-[var(--text-tertiary)] mt-1">To be added</p>
                        </div>
                    </div>

                    <Divider />

                    {/* ───── The Problem ───── */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                            The Data Labeling Bottleneck
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                            In computer vision, video data is abundant — thousands of terabytes flow through IP-based camera networks daily.
                            But <strong className="text-[var(--text-primary)]">labeled</strong> video data? That's the bottleneck. Manually scrubbing through
                            hours of footage to find a specific event — a forklift violation, a safety breach, a product defect — is prohibitively expensive.
                            Companies spend an estimated <strong className="text-[var(--text-primary)]">$25–$50 per hour</strong> on human annotators,
                            leading to the rise of expensive services like AWS SageMaker Ground Truth and other data labeling vendors.
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                            Breakthroughs in <strong className="text-[var(--text-primary)]">semantic video understanding</strong> allow us to invert
                            this workflow entirely. Instead of manually hunting for events, we treat video as data that can be queried, clustered,
                            and auto-labeled. This isn't just a time-saver — it's a <strong className="text-[var(--text-primary)]">force multiplier</strong> for
                            deploying Vision Language Models (VLLMs) in production environments.
                        </p>
                    </section>

                    {/* ───── Business Impact Stats ───── */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
                        <StatCard value="97%" label="Faster than manual" icon={Clock} />
                        <StatCard value="90%+" label="Cost reduction" icon={DollarSign} />
                        <StatCard value="3 formats" label="JSON, CSV, COCO" icon={Download} />
                        <StatCard value="2560-dim" label="Marengo embeddings" icon={Cpu} />
                    </div>

                    <Divider />

                    {/* ───── Core Features ───── */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                            Core Features
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)] mb-6">
                            Everything you need to go from raw footage to training-ready datasets.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FeatureCard
                                icon={Video}
                                title="Video Index Management"
                                description="Upload videos into named indexes. Organize datasets by project, domain, or experiment. Track video count, duration, and status at a glance."
                                color="text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
                            />
                            <FeatureCard
                                icon={Tag}
                                title="AI-Powered Annotation"
                                description="Define custom label taxonomies, then let TwelveLabs generate frame-accurate annotations with timestamps, descriptions, and confidence scores."
                                color="text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400"
                            />
                            <FeatureCard
                                icon={Search}
                                title="Semantic Video Search"
                                description="Search for specific moments across your entire video library using natural language queries. No keywords needed — search by meaning."
                                color="text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400"
                            />
                            <FeatureCard
                                icon={Database}
                                title="Embedding Visualization"
                                description="Visualize 2560-dimensional Marengo embeddings projected into 2D space via PCA. See how your videos cluster by semantic similarity."
                                color="text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400"
                            />
                            <FeatureCard
                                icon={Download}
                                title="Multi-Format Export"
                                description="Download annotations as JSON for raw access, CSV for spreadsheets, or COCO format for direct use in object detection pipelines."
                                color="text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400"
                            />
                            <FeatureCard
                                icon={BarChart3}
                                title="ROI Calculator"
                                description="See real-time cost and time comparisons between manual annotation and TwelveLabs-powered labeling for your selected videos."
                                color="text-pink-600 bg-pink-50 dark:bg-pink-900/20 dark:text-pink-400"
                            />
                        </div>
                    </section>

                    <Divider />

                    {/* ───── How It Works ───── */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                            How It Works
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)] mb-8">
                            A three-step pipeline from raw video to training-ready dataset.
                        </p>

                        {/* Step 1 */}
                        <div className="mb-10">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
                                    style={{ background: 'linear-gradient(135deg, #D9F99D 0%, #FDE047 100%)', color: '#1a1a1a' }}>
                                    1
                                </span>
                                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                                    Upload & Index Videos
                                </h3>
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3 ml-10">
                                Videos are uploaded to TwelveLabs via the <code className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-xs font-mono text-primary-500">tasks.create()</code> API.
                                Each video is processed through the Marengo 3.0 engine, which generates multimodal embeddings
                                encoding visual, audio, and textual content into a 2560-dimensional vector space.
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
                                    style={{ background: 'linear-gradient(135deg, #D9F99D 0%, #FDE047 100%)', color: '#1a1a1a' }}>
                                    2
                                </span>
                                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                                    Auto-Annotate with Custom Labels
                                </h3>
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3 ml-10">
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
                                    style={{ background: 'linear-gradient(135deg, #D9F99D 0%, #FDE047 100%)', color: '#1a1a1a' }}>
                                    3
                                </span>
                                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                                    Export & Train
                                </h3>
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3 ml-10">
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
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                            Understanding Your Data Through Embeddings
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                            Every video indexed by TwelveLabs is represented as a <strong className="text-[var(--text-primary)]">2560-dimensional embedding vector</strong> generated
                            by the Marengo 3.0 model. These vectors capture the semantic meaning of video content across visual, audio, and textual modalities.
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                            The Embeddings tab in each index uses <strong className="text-[var(--text-primary)]">Principal Component Analysis (PCA)</strong> to project
                            these high-dimensional vectors into 2D space. Videos that are semantically similar to each other appear as clusters —
                            giving you an intuitive way to audit data quality, identify duplicates, and discover patterns before training.
                        </p>
                        <CodeBlock title="Custom power-iteration PCA (runs in-browser)" language="javascript">
                            {`// Build N×N gram matrix instead of dim×dim covariance
// This keeps computation O(N³) instead of O(dim³ = 2560³)
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
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                            Why TwelveLabs?
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                            TwelveLabs provides the foundational video understanding models that power every feature in this application.
                        </p>

                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                            {[
                                {
                                    icon: Cpu,
                                    title: 'Marengo 3.0 — Multimodal Embeddings',
                                    desc: 'State-of-the-art video representation model that encodes visual, audio, and textual content into a unified 2560-dimensional vector space. Powers semantic search, clustering, and similarity detection.',
                                },
                                {
                                    icon: Zap,
                                    title: 'Pegasus 1.2 — Generative Video Understanding',
                                    desc: 'Generates structured, human-readable descriptions and labels from video content. Understands temporal relationships, object interactions, and scene transitions with frame-level accuracy.',
                                },
                                {
                                    icon: Shield,
                                    title: 'Enterprise-Grade Infrastructure',
                                    desc: 'SOC 2 compliant, built for scale. Process thousands of hours of video through a simple REST API with consistent, predictable pricing and 99.9% uptime.',
                                },
                                {
                                    icon: GitBranch,
                                    title: 'Research-Backed Innovation',
                                    desc: 'TwelveLabs\' research team publishes cutting-edge work on video understanding, continuously improving model accuracy and expanding capabilities into new domains.',
                                },
                            ].map(({ icon: Ic, title, desc }, i) => (
                                <div
                                    key={i}
                                    className={`flex items-start gap-4 p-5 ${i > 0 ? 'border-t border-[var(--border)]' : ''}`}
                                >
                                    <div className="p-2 rounded-xl bg-primary-500/10 shrink-0">
                                        <Ic className="w-5 h-5 text-primary-500" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{title}</h4>
                                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <Divider />

                    {/* ───── ROI Section ───── */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                            From Curated Data to Business Impact
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                            The output of this tool — structured, labeled datasets — is not just a file; it's an actionable asset that
                            drives business intelligence and model performance.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Zap className="w-4 h-4 text-yellow-500" strokeWidth={2} />
                                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Accelerating VLLM Fine-Tuning</h3>
                                </div>
                                <ul className="space-y-2">
                                    <li className="text-xs text-[var(--text-secondary)] leading-relaxed flex items-start gap-2">
                                        <ChevronRight className="w-3 h-3 text-primary-500 mt-0.5 shrink-0" />
                                        <span><strong className="text-[var(--text-primary)]">Skip Feature Extraction</strong> — Pre-computed embeddings mean you can train a classifier in seconds, not hours.</span>
                                    </li>
                                    <li className="text-xs text-[var(--text-secondary)] leading-relaxed flex items-start gap-2">
                                        <ChevronRight className="w-3 h-3 text-primary-500 mt-0.5 shrink-0" />
                                        <span><strong className="text-[var(--text-primary)]">Reduce Hallucinations</strong> — Curated data ensures your model learns from distinct, well-separated examples.</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <BarChart3 className="w-4 h-4 text-blue-500" strokeWidth={2} />
                                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">Operational Intelligence</h3>
                                </div>
                                <ul className="space-y-2">
                                    <li className="text-xs text-[var(--text-secondary)] leading-relaxed flex items-start gap-2">
                                        <ChevronRight className="w-3 h-3 text-primary-500 mt-0.5 shrink-0" />
                                        <span><strong className="text-[var(--text-primary)]">Heatmap of Hazards</strong> — Clustering reveals systemic operational failures, not just one-off events.</span>
                                    </li>
                                    <li className="text-xs text-[var(--text-secondary)] leading-relaxed flex items-start gap-2">
                                        <ChevronRight className="w-3 h-3 text-primary-500 mt-0.5 shrink-0" />
                                        <span><strong className="text-[var(--text-primary)]">Trend Analysis</strong> — Track if specific violation clusters are growing or shrinking over time.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    <Divider />

                    {/* ───── Tech Stack ───── */}
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">
                            Technology Stack
                        </h2>
                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--border)] bg-gray-50 dark:bg-gray-800/30">
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Layer</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Technology</th>
                                        <th className="text-left px-5 py-3 text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Purpose</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {[
                                        ['Frontend', 'Next.js 16 + React 19', 'Server-side rendering, routing, and UI'],
                                        ['Video AI', 'TwelveLabs API', 'Embeddings (Marengo), annotations (Pegasus)'],
                                        ['Styling', 'Tailwind CSS', 'Utility-first responsive design'],
                                        ['Visualization', 'Canvas 2D + Custom PCA', 'Embedding scatter plots with power iteration'],
                                        ['Storage', 'Vercel Blob', 'Video file hosting before indexing'],
                                        ['Export', 'Client-side generation', 'JSON, CSV, and COCO format downloads'],
                                    ].map(([layer, tech, purpose], i) => (
                                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                                            <td className="px-5 py-3 font-medium text-[var(--text-primary)]">{layer}</td>
                                            <td className="px-5 py-3 font-mono text-xs text-primary-500">{tech}</td>
                                            <td className="px-5 py-3 text-[var(--text-secondary)] text-xs">{purpose}</td>
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
                            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                                Ready to automate your video annotation?
                            </h2>
                            <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-lg mx-auto">
                                Get started with the API documentation, explore the source code, or talk to our team about
                                enterprise deployment options.
                            </p>
                            <div className="flex flex-wrap justify-center gap-3">
                                <a
                                    href="https://docs.twelvelabs.io/docs/get-started/introduction"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-900 transition-all hover:brightness-95"
                                    style={{ background: 'linear-gradient(135deg, #D9F99D 0%, #FDE047 100%)' }}
                                >
                                    <BookOpen className="w-4 h-4" strokeWidth={2} />
                                    API Documentation
                                </a>
                                <a
                                    href="https://www.twelvelabs.io/research"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all"
                                >
                                    Research Papers
                                    <ExternalLink className="w-3 h-3 opacity-60" />
                                </a>
                                <a
                                    href="https://www.twelvelabs.io/contact"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-all"
                                >
                                    Talk to Sales
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>
                    </section>

                    {/* ───── Footer ───── */}
                    <footer className="pb-8 text-center">
                        <p className="text-xs text-[var(--text-tertiary)]">
                            Built by{' '}
                            <a href="https://github.com/nathanchess" target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                                Nathan Che
                            </a>
                            {' '}• Powered by{' '}
                            <a href="https://www.twelvelabs.io" target="_blank" rel="noopener noreferrer" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                                TwelveLabs
                            </a>
                        </p>
                    </footer>

                </article>
            </main>
        </div>
    );
}
