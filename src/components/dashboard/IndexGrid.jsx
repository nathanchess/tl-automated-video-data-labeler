import { useMemo } from 'react';
import CreateIndexCard from './UploadCard';
import IndexCard from './IndexCard';

export default function IndexGrid({ sortBy, filterQuery, onCreateIndex, indexes, loading }) {
    const filtered = useMemo(() => {
        let items = [...(indexes || [])];

        // Sort
        switch (sortBy) {
            case 'date':
                items.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'duration':
                items.sort((a, b) => b.totalDurationSec - a.totalDurationSec);
                break;
            case 'videoCount':
                items.sort((a, b) => b.videoCount - a.videoCount);
                break;
        }

        // Filter
        const q = (filterQuery || '').trim().toLowerCase();
        if (q) {
            items = items.filter((idx) => idx.title.toLowerCase().includes(q));
        }

        return items;
    }, [sortBy, filterQuery, indexes]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            <CreateIndexCard onClick={onCreateIndex} />
            {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="rounded-2xl bg-surface-white border border-border-secondary overflow-hidden animate-pulse"
                    >
                        <div className="aspect-[2/1] bg-gray-200 dark:bg-gray-700" />
                        <div className="p-4 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                        </div>
                    </div>
                ))
            ) : (
                filtered.map((index) => (
                    <IndexCard key={index.id} {...index} />
                ))
            )}
        </div>
    );
}
