import { useMemo } from 'react';
import { sampleIndexes } from '@/data/sampleIndexes';
import CreateIndexCard from './UploadCard';
import IndexCard from './IndexCard';

/** Convert duration strings like "4h 32m" to total minutes for comparison */
function durationToMinutes(d) {
    let total = 0;
    const hours = d.match(/(\d+)h/);
    const mins = d.match(/(\d+)m/);
    if (hours) total += parseInt(hours[1], 10) * 60;
    if (mins) total += parseInt(mins[1], 10);
    return total;
}

export default function IndexGrid({ sortBy, filterQuery, onCreateIndex }) {
    const filtered = useMemo(() => {
        let items = [...sampleIndexes];

        // Sort
        switch (sortBy) {
            case 'date':
                items.sort((a, b) => new Date(b.date) - new Date(a.date));
                break;
            case 'duration':
                items.sort((a, b) => durationToMinutes(b.duration) - durationToMinutes(a.duration));
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
    }, [sortBy, filterQuery]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            <CreateIndexCard onClick={onCreateIndex} />
            {filtered.map((index) => (
                <IndexCard key={index.id} {...index} />
            ))}
        </div>
    );
}
