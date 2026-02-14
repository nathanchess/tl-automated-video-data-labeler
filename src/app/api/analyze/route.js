import { TwelveLabs } from "twelvelabs-js"
import { NextResponse } from "next/server"

const tl_client = new TwelveLabs({
    apiKey: process.env.TL_API_KEY
})

export async function POST(request) {

    const { videoId, prompt, response_format } = await request.json()

    if (!videoId) {
        return NextResponse.json({ error: "Video ID is required" }, { status: 400 })
    }

    if (!prompt) {
        return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    const parameters = {
        videoId: videoId,
        prompt: prompt,
        temperature: 0.2
    }

    if (response_format) {
        parameters.response_format = response_format
    }

    const result = await tl_client.analyze(parameters)

    return NextResponse.json(result, { status: 200 })

}