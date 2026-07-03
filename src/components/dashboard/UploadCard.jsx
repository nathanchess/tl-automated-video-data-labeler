import { PlusIcon } from '@twelvelabs-io/react';

export default function CreateIndexCard({ onClick }) {
    return (
        <div
            onClick={onClick}
            className="group relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl p-8 transition-all"
        >
            <div
                className="absolute inset-0"
                style={{
                    background:
                        'linear-gradient(180deg, #F5E6DC 0%, #FCCAA0 30%, #F7A97B 55%, #E8D574 75%, #B8E986 100%)',
                }}
            />

            <div
                className="absolute inset-0 backdrop-blur-xl"
                style={{ background: 'rgba(255, 255, 255, 0.45)' }}
            />
            <div
                className="absolute inset-0 hidden backdrop-blur-xl dark:block"
                style={{ background: 'rgba(29, 28, 27, 0.55)' }}
            />

            <div className="pointer-events-none absolute inset-0 rounded-2xl border border-border-secondary" />

            <div className="relative z-10 flex size-14 items-center justify-center rounded-full bg-surface-white/90 shadow-card transition-transform duration-200 group-hover:scale-110">
                <PlusIcon className="size-7 text-foreground-body" />
            </div>
            <div className="relative z-10 text-center">
                <p className="text-base font-bold text-foreground-body">Create Index</p>
                <p className="mt-4 text-sm text-foreground-subtle">
                    Start a new video collection you want to annotate.
                </p>
            </div>
        </div>
    );
}
