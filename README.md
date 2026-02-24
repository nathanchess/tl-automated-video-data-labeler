<p align="center">
  <img src="public/TwelveLabs-Symbol.png" alt="TwelveLabs" width="80" />
</p>

<h1 align="center">Automated Video Data Labeler</h1>

<p align="center">
  <strong>AI-powered video annotation platform built on TwelveLabs</strong><br/>
  Replace hours of manual labeling with multimodal video understanding
</p>

<p align="center">
  <a href="https://docs.twelvelabs.io/docs/get-started/introduction"><img src="https://img.shields.io/badge/TwelveLabs-Documentation-D9F99D?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMiAzaDZhNCA0IDAgMCAxIDQgNCA0IDQgMCAwIDEgNC00aDZNMTIgN3YxNCIvPjxwYXRoIGQ9Ik0yIDN2MTRhMSAxIDAgMCAwIDEgMWg1YTQgNCAwIDAgMSA0IDQgNCA0IDAgMCAxIDQtNGg1YTEgMSAwIDAgMCAxLTFWMyIvPjwvc3ZnPg==&logoColor=000000" alt="Docs"/></a>
  <a href="https://www.twelvelabs.io/research"><img src="https://img.shields.io/badge/Research-Papers-4B5563?style=for-the-badge&logo=googlescholar&logoColor=white" alt="Research"/></a>
  <a href="https://www.twelvelabs.io/contact"><img src="https://img.shields.io/badge/Talk_to-Sales-FDE047?style=for-the-badge&logo=handshake&logoColor=000000" alt="Contact"/></a>
</p>

---

## 📸 Demo

<!-- Replace with your actual GIF once available -->
<p align="center">
  <img src="assets/demo.gif" alt="Demo GIF" width="800" />
  <br/>
  <em>Placeholder — GIF walkthrough coming soon</em>
</p>

---

## 📐 Architecture & Video Walkthrough

<p align="center">
  <a href="https://lucid.app/lucidchart/8b6750d8-7df0-45b1-bad7-adafbd079fab/edit?viewport_loc=-1795%2C-232%2C8635%2C4229%2C0_0&invitationId=inv_5887ccd5-587d-4e6f-ac32-e8784da38e4a">
    <img src="https://img.shields.io/badge/View_Architecture-LucidChart-F97316?style=for-the-badge&logo=lucidchart&logoColor=white" alt="Architecture Diagram"/>
  </a>
  &nbsp;&nbsp;
  <a href="https://www.youtube.com/watch?v=lZkDvpmez7A">
    <img src="https://img.shields.io/badge/Watch_Demo-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="YouTube Demo"/>
  </a>
</p>

<p align="center">
  <img src="public/architecture.jpeg" alt="Architecture Diagram" width="800" />
</p>

<p align="center">
  <a href="https://www.youtube.com/watch?v=lZkDvpmez7A">
    <img src="https://img.youtube.com/vi/lZkDvpmez7A/maxresdefault.jpg" alt="Watch Demo Video" width="800" />
  </a>
  <br/>
  <em>▶️ Click to watch the full demo walkthrough on YouTube</em>
</p>

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| **Video Index Management** | Upload and organize video datasets into named indexes with metadata |
| **AI-Powered Annotation** | Define custom label taxonomies, get frame-accurate annotations with timestamps |
| **Semantic Video Search** | Search across video content using natural language queries |
| **Embedding Visualization** | 2D PCA projection of 2560-dim Marengo embeddings with interactive canvas |
| **Multi-Format Export** | Download annotations as JSON, CSV, or COCO format |
| **ROI Calculator** | Real-time cost/time comparison vs. manual human annotation |

---

## 💼 Business Impact

Manual video annotation costs **$25–50/hr** per human annotator and scales linearly with footage volume. This tool eliminates that bottleneck:

| Metric | Manual | TwelveLabs |
|--------|--------|------------|
| **Time per video** | ~3× video duration | ~60 seconds |
| **Cost per hour of footage** | ~$75–150 | ~$3 |
| **Output format** | Inconsistent | Structured JSON/CSV/COCO |
| **Scalability** | Linear headcount | API call |

> **97% faster** and **90%+ cost reduction** compared to traditional annotation workflows.

The structured datasets produced are directly usable for:
- Fine-tuning Vision Language Models (VLLMs)
- Training object detection and action recognition models
- Building operational intelligence dashboards
- Compliance and safety auditing at scale

---

## 🔑 Required API Keys

| Variable | Description | Get it from |
|----------|-------------|-------------|
| `TWELVELABS_API_KEY` | TwelveLabs API key for video understanding | [TwelveLabs Dashboard](https://dashboard.twelvelabs.io/) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token for video uploads | [Vercel Dashboard](https://vercel.com/dashboard) |

Create a `.env.local` file in the project root:

```env
TWELVELABS_API_KEY=your_twelvelabs_api_key_here
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
```

---

## 🏗️ Running Locally

### Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **npm** or **pnpm**
- A [TwelveLabs API key](https://dashboard.twelvelabs.io/)
- A [Vercel Blob storage token](https://vercel.com/docs/storage/vercel-blob)

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/nathanchess/tl-automated-video-data-labeler.git
cd tl-automated-video-data-labeler

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local
# Edit .env.local with your API keys (see Required API Keys section above)

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the dashboard.

---

## ☁️ Deployment

### Vercel (Recommended)

1. Push your repo to GitHub
2. Import the project on [vercel.com/new](https://vercel.com/new)
3. Add environment variables (`TWELVELABS_API_KEY`, `BLOB_READ_WRITE_TOKEN`) in the Vercel project settings
4. Deploy — Vercel handles builds, SSL, and CDN automatically

### EC2 / Self-Hosted

```bash
# Build for production
npm run build

# Start the production server
npm start
```

For persistent background processes, use `pm2`:

```bash
npm install -g pm2
pm2 start npm --name "video-labeler" -- start
pm2 save
```

---

## 🧱 Key Components

```
src/
├── app/
│   ├── page.js                    # Home — index grid with dynamic video grouping
│   ├── overview/page.js           # Blog-style overview with docs & business case
│   ├── [indexName]/page.js        # Index detail — video list, annotation, search
│   └── api/
│       ├── videos/route.js        # GET: list videos | POST: upload & index via TwelveLabs
│       ├── search/route.js        # Semantic search via TwelveLabs Search API
│       ├── annotate/route.js      # AI annotation with custom label taxonomies
│       ├── upload/route.js        # Vercel Blob upload handler
│       └── embeddings/route.js    # Fetch video embedding vectors
│
├── components/dashboard/
│   ├── Sidebar.jsx                # Navigation with route-aware active states
│   ├── IndexGrid.jsx              # Responsive grid of index cards with sorting
│   ├── IndexCard.jsx              # Individual index card with thumbnails
│   ├── VideoList.jsx              # Video list with selection, search, and status
│   ├── CreateIndexModal.jsx       # Upload modal with progress streaming
│   ├── DownloadModal.jsx          # Export format selector (JSON/CSV/COCO)
│   └── EmbeddingsView.jsx         # 2D PCA scatter plot with custom power iteration
```

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 16 + React 19 | SSR, routing, and UI |
| Video AI | TwelveLabs API | Embeddings (Marengo 3.0), annotations (Pegasus 1.2) |
| Styling | Tailwind CSS | Utility-first responsive design |
| Visualization | Canvas 2D + Custom PCA | Embedding scatter plots with power iteration |
| Storage | Vercel Blob | Video file hosting before indexing |
| Export | Client-side generation | JSON, CSV, and COCO format downloads |

---

## 📚 Resources

- [TwelveLabs Documentation](https://docs.twelvelabs.io/docs/get-started/introduction) — API reference and getting started guide
- [TwelveLabs Research](https://www.twelvelabs.io/research) — Academic papers behind Marengo and Pegasus models
- [Talk to Sales](https://www.twelvelabs.io/contact) — Enterprise deployment and custom solutions
- [GitHub Issues](https://github.com/nathanchess/tl-automated-video-data-labeler/issues) — Bug reports and feature requests

---

<p align="center">
  Built by <a href="https://github.com/nathanchess">Nathan Che</a> · Powered by <a href="https://www.twelvelabs.io">TwelveLabs</a>
</p>
