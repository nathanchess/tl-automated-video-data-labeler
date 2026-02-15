import { TwelveLabs } from "twelvelabs-js"
import { NextResponse } from "next/server"

const tl_client = new TwelveLabs({
    apiKey: process.env.TL_API_KEY
})

export async function POST(request) {

    const { query } = await request.json()

    if (!query) {
        return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }

    const indexPager = await tl_client.indexes.list()
    let indexId = null;

    for await (const index of indexPager) {
        if (index.indexName === process.env.TL_INDEX_NAME) {
            indexId = index.id
        }
    }

    if (!indexId) {
        return NextResponse.json({ error: "Index not found" }, { status: 404 })
    }

    const result = await tl_client.search.query({
        indexId: indexId,
        queryText: query,
        searchOptions: ['visual', 'audio']
    })

    return NextResponse.json(result, { status: 200 })

}