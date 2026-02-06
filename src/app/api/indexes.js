import { TwelveLabs } from "twelvelabs-js"
import { NextResponse } from "next/server"

const tl_client = new TwelveLabs({
    apiKey: process.env.TL_API_KEY
})

export default async function GET(request) {
    const indexPager = await tl_client.indexes.list()
    return NextResponse.json(indexPager)
}

export default async function POST(request) {

    const body = await request.json()
    const { indexName } = body

    const index = await tl_client.indexes.create({
        indexName: indexName,
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

    return NextResponse.json(index)

}