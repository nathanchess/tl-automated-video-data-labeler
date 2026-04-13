'use client';

import { Github, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

const SOURCE_REPO_URL = 'https://github.com/nathanchess/tl-automated-video-data-labeler';

/**
 * Shown when the TwelveLabs API returns HTTP 429 (rate limit / quota).
 *
 * Props:
 *   open    – boolean
 *   onClose – () => void  (called on both dismiss paths)
 *   partial – null | { videoId, filename, annotationCount, coveredUntil }
 *             When non-null the video had partial chunks completed before the
 *             rate-limit hit; those results are already saved and visible.
 */
export default function RateLimitModal({ open, onClose, partial = null }) {
    if (!open) return null;

    const isPartial = partial != null && partial.annotationCount > 0;

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="rate-limit-title"
            aria-describedby="rate-limit-desc"
        >
            <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl overflow-hidden scale-100 animate-pop-in">

                {/* Header */}
                <div className="px-6 py-4 border-b border-[var(--border)] flex items-start gap-3">
                    <img
                        src="/TwelveLabs-Symbol.png"
                        alt=""
                        className="w-10 h-10 rounded-xl shrink-0 mt-0.5"
                    />
                    <div className="min-w-0">
                        <h3 id="rate-limit-title" className="text-lg font-semibold text-[var(--text-primary)] leading-snug">
                            {isPartial ? 'Partial analysis saved' : 'Our services are busy'}
                        </h3>
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                            {isPartial ? 'Analysis paused — quota reached mid-video' : 'TwelveLabs API quota reached'}
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {isPartial ? (
                        <>
                            {/* Partial results summary */}
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 space-y-2">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                    <span className="text-sm font-medium text-[var(--text-primary)]">
                                        {partial.annotationCount} segment{partial.annotationCount !== 1 ? 's' : ''} annotated
                                    </span>
                                </div>
                                {partial.coveredUntil && (
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-[var(--text-tertiary)] shrink-0" />
                                        <span className="text-sm text-[var(--text-secondary)]">
                                            Coverage up to <span className="font-mono font-medium text-[var(--text-primary)]">{partial.coveredUntil}</span>
                                        </span>
                                    </div>
                                )}
                                {partial.filename && (
                                    <p className="text-xs text-[var(--text-tertiary)] truncate pl-6">
                                        {partial.filename}
                                    </p>
                                )}
                            </div>

                            <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <p id="rate-limit-desc" className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                    The rest of the video could not be analysed right now because the API quota was reached.
                                    The segments above are saved and available — you can download or review them now,
                                    and re-run annotation on this video when the quota resets.
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <p id="rate-limit-desc" className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                Our servers are currently in high demand. Please check back soon.
                            </p>
                            <div className="rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 space-y-3">
                                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                    To try this app with your own TwelveLabs account, pull the source and add your API key.
                                </p>
                                <a
                                    href={SOURCE_REPO_URL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--background)] transition-colors"
                                >
                                    <Github className="w-4 h-4" strokeWidth={2} />
                                    View on GitHub
                                </a>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[var(--border)] flex justify-end gap-3">
                    {isPartial ? (
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary-500 text-gray-900 hover:brightness-95 active:brightness-90 transition-[filter]"
                        >
                            View partial results
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary-500 text-gray-900 hover:brightness-95 active:brightness-90 transition-[filter]"
                        >
                            OK
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
