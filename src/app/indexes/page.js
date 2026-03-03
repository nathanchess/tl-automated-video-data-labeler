'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import IndexGrid from '@/components/dashboard/IndexGrid';
import CreateIndexModal from '@/components/dashboard/CreateIndexModal';

/** Format seconds → "4h 32m" or "12m" */
function formatDuration(totalSec) {
    if (!totalSec) return '0m';
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
}

/** Format ISO date → "Feb 8, 2026" */
function formatDate(isoString) {
    if (!isoString) return '';
    try {
        return new Date(isoString).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        });
    } catch { return isoString; }
}

export default function IndexesPage() {
    const [sortBy, setSortBy] = useState('date');
    const [filterQuery, setFilterQuery] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch all videos from API
    const fetchVideos = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/videos');
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const allVideos = await res.json();
            setVideos(allVideos);
        } catch (err) {
            console.error('Failed to fetch videos:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    // Group videos by indexName from user_metadata → derive index objects
    const indexes = useMemo(() => {
        const groups = {};

        videos.forEach((v) => {
            let meta = v.user_metadata;
            if (!meta) return;
            try {
                if (typeof meta === 'string') meta = JSON.parse(meta);
            } catch { return; }

            const indexName = meta.indexName;
            if (!indexName) return;

            if (!groups[indexName]) {
                groups[indexName] = {
                    id: indexName,
                    title: indexName,
                    description: meta.description || '',
                    videos: [],
                    totalDurationSec: 0,
                    latestDate: null,
                    thumbnails: [],
                };
            }

            const g = groups[indexName];
            g.videos.push(v);
            g.totalDurationSec += v.systemMetadata?.duration || 0;

            // Track the most recent video date
            const vDate = v.createdAt || v.created_at;
            if (vDate && (!g.latestDate || new Date(vDate) > new Date(g.latestDate))) {
                g.latestDate = vDate;
            }

            // Collect thumbnails (first from hls, then video_url as fallback)
            const thumb = v.hls?.thumbnail_urls?.[0];
            if (thumb && g.thumbnails.length < 4) {
                g.thumbnails.push(thumb);
            }
        });

        return Object.values(groups).map((g) => ({
            id: g.id,
            title: g.title,
            description: g.description,
            videoCount: g.videos.length,
            totalDurationSec: g.totalDurationSec,
            duration: formatDuration(g.totalDurationSec),
            date: formatDate(g.latestDate),
            thumbnails: g.thumbnails,
        }));
    }, [videos]);

    return (
        <div className="flex min-h-screen">
            <Sidebar />

            {/* Main content */}
            <main className="flex-1 lg:ml-60 p-4 lg:p-6">
                <div>
                    <Header sortBy={sortBy} onSortChange={setSortBy} filterQuery={filterQuery} onFilterChange={setFilterQuery} />
                    <IndexGrid
                        sortBy={sortBy}
                        filterQuery={filterQuery}
                        onCreateIndex={() => setModalOpen(true)}
                        indexes={indexes}
                        loading={loading}
                    />
                </div>
            </main>

            <CreateIndexModal open={modalOpen} onClose={() => setModalOpen(false)} onComplete={fetchVideos} />
        </div>
    );
}
