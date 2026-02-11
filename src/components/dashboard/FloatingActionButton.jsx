import { MessageCircle } from 'lucide-react';

export default function FloatingActionButton() {
    return (
        <button
            className="
        fixed bottom-6 right-6 z-50
        w-14 h-14 rounded-full
        bg-gray-900 dark:bg-white
        flex items-center justify-center
        shadow-lg hover:scale-110
        transition-transform duration-200
        cursor-pointer
      "
            aria-label="Open chat"
        >
            <MessageCircle className="w-6 h-6 text-white dark:text-gray-900" strokeWidth={1.5} />
        </button>
    );
}
