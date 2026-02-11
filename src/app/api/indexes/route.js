import { TwelveLabs } from "twelvelabs-js"
import { NextResponse } from "next/server"

const tl_client = new TwelveLabs({
    apiKey: process.env.TL_API_KEY
})

export async function GET(request) {

    const indexPager = await tl_client.indexes.list()

    for await (const index of indexPager) {
        if (index.indexName === process.env.TL_INDEX_NAME) {
            return NextResponse.json({
                indexId: index.id,
            }, { status: 200 })
        }
    }

    const index = await tl_client.indexes.create({
        indexName: process.env.TL_INDEX_NAME,
        models: [
            {
                modelName: "marengo3.0",
                modelOptions: ["visual", "audio"]
            },
            {
                modelName: "pegasus1.2",
                modelOptions: ["visual", "audio"]
            }
        ]
    })

    return NextResponse.json({
        indexId: index.id
    }, { status: 200 })

}

export async function POST(request) {

    const index = await tl_client.indexes.create({
        indexName: process.env.TL_INDEX_NAME,
        models: [
            {
                modelName: "marengo3.0",
                modelOptions: ["visual", "audio"]
            },
            {
                modelName: "pegasus1.2",
                modelOptions: ["visual", "audio"]
            }
        ]
    })

    return NextResponse.json(index, { status: 200 })

}