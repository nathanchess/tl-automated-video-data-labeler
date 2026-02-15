import { useState } from 'react';
import { X, FileJson, FileSpreadsheet, Box, CheckCircle, Download } from 'lucide-react';

export default function DownloadModal({ isOpen, onClose, onDownload, totalVideos }) {
    const [format, setFormat] = useState('json');
    const [isExporting, setIsExporting] = useState(false);

    if (!isOpen) return null;

    const handleDownload = async () => {
        setIsExporting(true);
        // Small delay to allow UI to update if needed, though mostly synchronous
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            await onDownload(format);
            onClose();
        } catch (error) {
            console.error("Export failed", error);
        } finally {
            setIsExporting(false);
        }
    };

    const options = [
        {
            id: 'json',
            label: 'JSON Dataset',
            description: 'Raw annotations with full metadata and timestamps.',
            icon: FileJson,
            color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400'
        },
        {
            id: 'csv',
            label: 'CSV Spreadsheet',
            description: 'Tabular format compatible with Excel and Google Sheets.',
            icon: FileSpreadsheet,
            color: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
        },
        {
            id: 'coco',
            label: 'COCO Format',
            description: 'Standard object detection format with bounding box placeholders.',
            icon: Box,
            color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400'
        }
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden scale-100 animate-pop-in">

                {/* Header */}
                <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                            Download Dataset
                        </h3>
                        <p className="text-xs text-[var(--text-tertiary)]">
                            Exporting annotations for {totalVideos} video{totalVideos !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {options.map((opt) => (
                        <div
                            key={opt.id}
                            onClick={() => setFormat(opt.id)}
                            className={`
                                relative flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all
                                ${format === opt.id
                                    ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/10 ring-1 ring-primary-500'
                                    : 'border-[var(--border)] hover:border-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                                }
                            `}
                        >
                            <div className={`p-2 rounded-lg ${opt.color}`}>
                                <opt.icon className="w-5 h-5" strokeWidth={2} />
                            </div>
                            <div className="flex-1">
                                <h4 className={`text-sm font-semibold mb-0.5 ${format === opt.id ? 'text-primary-700 dark:text-primary-300' : 'text-[var(--text-primary)]'}`}>
                                    {opt.label}
                                </h4>
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                                    {opt.description}
                                </p>
                            </div>
                            {format === opt.id && (
                                <div className="absolute top-4 right-4 text-primary-500">
                                    <CheckCircle className="w-5 h-5 fill-primary-100 dark:fill-primary-900/50" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--background)] flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={isExporting}
                        className="flex items-center gap-2 px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-semibold rounded-lg shadow-lg shadow-primary-500/20 transition-all disabled:opacity-70 disabled:cursor-wait"
                    >
                        {isExporting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Download Selected
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
