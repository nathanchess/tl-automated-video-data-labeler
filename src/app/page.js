'use client';

import { useState } from 'react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import IndexGrid from '@/components/dashboard/IndexGrid';
import CreateIndexModal from '@/components/dashboard/CreateIndexModal';

export default function Home() {
    const [sortBy, setSortBy] = useState('date');
    const [filterQuery, setFilterQuery] = useState('');
    const [modalOpen, setModalOpen] = useState(false);

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
