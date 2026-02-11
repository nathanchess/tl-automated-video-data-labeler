import { Plus } from 'lucide-react';

export default function CreateIndexCard({ onClick }) {
    return (
        <div
            onClick={onClick}
            className="
                relative overflow-hidden
                rounded-2xl
                p-8 flex flex-col items-center justify-center gap-4
                cursor-pointer transition-all
                min-h-[280px] group
            "
        >
            {/* Warm gradient background */}
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(180deg, #F5E6DC 0%, #FCCAA0 30%, #F7A97B 55%, #E8D574 75%, #B8E986 100%)',
                }}
            />

            {/* Glass overlay */}
            <div
                className="absolute inset-0 backdrop-blur-xl"
                style={{
                    background: 'rgba(255, 255, 255, 0.45)',
                }}
            />
            <div
                className="dark:block hidden absolute inset-0 backdrop-blur-xl"
                style={{
                    background: 'rgba(24, 24, 27, 0.55)',
                }}
            />

            {/* Glass border */}
            <div className="absolute inset-0 rounded-2xl border border-white/30 dark:border-white/10 pointer-events-none" />

            <div className="relative z-10 w-14 h-14 rounded-full bg-white/80 dark:bg-white/90 flex items-center justify-center shadow-card group-hover:scale-110 transition-transform duration-200">
                <Plus className="w-7 h-7 text-gray-900" strokeWidth={2} />
            </div>
            <div className="relative z-10 text-center">
                <p className="text-base font-bold text-[var(--text-primary)]">
                    Create Index
                </p>
                <p className="text-sm text-[var(--text-tertiary)] mt-4">
                    Start a new video collection you want to annotate.
                </p>
            </div>
        </div>
    );
}
