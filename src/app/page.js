'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import IndexGrid from '@/components/dashboard/IndexGrid';
import CreateIndexModal from '@/components/dashboard/CreateIndexModal';

export default function Home() {
    const [sortBy, setSortBy] = useState('date');
    const [filterQuery, setFilterQuery] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [indexId, setIndexId] = useState(null);
    const [indexStatus, setIndexStatus] = useState('loading'); // 'loading' | 'ready' | 'error'

    // Verify / create index on app load
    useEffect(() => {
        async function verifyIndex() {
            try {
                const res = await fetch('/api/indexes');
                if (!res.ok) throw new Error(`API error: ${res.status}`);
                const data = await res.json();
                setIndexId(data.indexId);
                setIndexStatus('ready');
                console.log('Index verified:', data.indexId);
            } catch (err) {
                console.error('Failed to verify index:', err);
                setIndexStatus('error');
            }
        }
        verifyIndex();
    }, []);

    return (
        <div className="flex min-h-screen">
            <Sidebar />

            {/* Main content */}
            <main className="flex-1 lg:ml-60 p-4 lg:p-6">
                <div>
                    <Header sortBy={sortBy} onSortChange={setSortBy} filterQuery={filterQuery} onFilterChange={setFilterQuery} />
                    <IndexGrid sortBy={sortBy} filterQuery={filterQuery} onCreateIndex={() => setModalOpen(true)} />
                </div>
            </main>

            <CreateIndexModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </div>
    );
}
