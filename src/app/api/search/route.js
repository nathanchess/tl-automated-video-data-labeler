import { TwelveLabs, TwelvelabsApiError } from "twelvelabs-js"
import { NextResponse } from "next/server"

const tl_client = new TwelveLabs({
    apiKey: process.env.TL_API_KEY
})

export async function POST(request) {
    try {
        const { query } = await request.json()

        if (!query) {
            return NextResponse.json({ error: "Query is required" }, { status: 400 })
        }

        // Always use the configured TwelveLabs index
        const targetName = process.env.TL_INDEX_NAME;
        console.log('[Search] Looking for TwelveLabs index:', targetName);

        const indexPager = await tl_client.indexes.list()
        let indexId = null;

        for await (const index of indexPager) {
            console.log('[Search] Found index:', index.indexName, '→', index.id);
            if (index.indexName === targetName) {
                indexId = index.id
            }
        }

        if (!indexId) {
            console.error('[Search] Index not found for name:', targetName);
            return NextResponse.json({ error: `Index "${targetName}" not found` }, { status: 404 })
        }

        console.log('[Search] Using index:', indexId, 'for query:', query);

        const resultPager = await tl_client.search.query({
            indexId: indexId,
            queryText: query,
            searchOptions: ['visual', 'audio']
        })

        // Collect all search results from the pager into an array
        const results = [];
        for (const item of resultPager.data || []) {
            results.push({
                videoId: item.videoId || item.video_id,
                start: item.start,
                end: item.end,
                score: item.score,
                confidence: item.confidence,
                rank: item.rank,
                thumbnailUrl: item.thumbnailUrl || item.thumbnail_url,
            });
        }

        console.log('[Search] Found', results.length, 'results');
        return NextResponse.json({ results }, { status: 200 })
    } catch (error) {
        if (error instanceof TwelvelabsApiError && error.statusCode === 429) {
            const body = error.body && typeof error.body === "object" ? error.body : {};
            return NextResponse.json(
                {
                    code: body.code ?? "too_many_requests",
                    message: typeof body.message === "string" ? body.message : "Rate limit exceeded.",
                },
                { status: 429 }
            );
        }
        console.error("[Search]", error);
        const msg = error instanceof Error ? error.message : "Search failed";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}