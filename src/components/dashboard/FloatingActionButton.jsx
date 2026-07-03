import { SpeechIcon } from '@twelvelabs-io/react';

export default function FloatingActionButton() {
    return (
        <button
            type="button"
            className="fixed bottom-6 right-6 z-50 flex size-14 cursor-pointer items-center justify-center rounded-full bg-surface-primary text-foreground-primary shadow-lg transition-transform duration-200 hover:scale-110"
            aria-label="Open chat"
        >
            <SpeechIcon className="size-6" />
        </button>
    );
}
