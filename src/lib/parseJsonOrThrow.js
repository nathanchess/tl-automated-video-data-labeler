/**
 * Build an error the UI treats as TwelveLabs / API rate limiting (HTTP 429).
 * @param {string} [apiMessage] Provider message, often includes retry time.
 */
export function createRateLimitError(apiMessage) {
    const e = new Error(
        apiMessage ||
            'The video AI service is handling high demand right now. Please wait and try again in a few minutes.'
    );
    e.isRateLimit = true;
    e.code = 'too_many_requests';
    return e;
}

/**
 * Parse JSON from a fetch Response; on 429 throws createRateLimitError; on other errors throws Error.
 */
export async function parseJsonOrThrow(res) {
    const data = await res.json().catch(() => ({}));
    if (res.status === 429) {
        throw createRateLimitError(
            typeof data.message === 'string' ? data.message : undefined
        );
    }
    if (!res.ok) {
        const err = new Error(data.error || data.message || `Request failed (${res.status})`);
        err.status = res.status;
        throw err;
    }
    return data;
}
