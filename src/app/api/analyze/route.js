import { TwelveLabs } from "twelvelabs-js"
import { NextResponse } from "next/server"

const tl_client = new TwelveLabs({
    apiKey: process.env.TL_API_KEY
})

export async function POST(request) {

    const { videoId, prompt } = await request.json()

    const result = await tl_client.analyze({
        videoId: videoId,
        prompt: prompt,
        temperature: 0.2
    })

    return NextResponse.json(result, { status: 200 })

}