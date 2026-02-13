import { TwelveLabs } from "twelvelabs-js"
import { NextResponse } from "next/server"

const tl_client = new TwelveLabs({
    apiKey: process.env.TL_API_KEY
})

export async function GET(request) {

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

    const videoPager = await tl_client.indexes.videos.list(indexId)
    const videos = []

    for await (const video of videoPager) {
        videos.push(video)
    }

    return NextResponse.json(videos, { status: 200 })

}

export async function POST(request) {

    // Pass in public video URLs and associated user metadata to add to TwelveLabs index.
    // Video URLS from Vercel Blob storage on client-side upload first.

    const { videoURLs, metadata } = await request.json()

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

    const totalVideos = videoURLs.length

    // Stream progress back to the client via SSE
    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder()

            function send(event, data) {
                controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
            }

            send('progress', {
                completed: 0,
                total: totalVideos,
                percent: 0,
                message: `Starting upload of ${totalVideos} video${totalVideos !== 1 ? 's' : ''}…`,
            })

            const videoData = []

            for (let i = 0; i < videoURLs.length; i++) {
                const videoURL = videoURLs[i]

                try {
                    send('progress', {
                        completed: i,
                        total: totalVideos,
                        percent: Math.round((i / totalVideos) * 100),
                        message: `Processing video ${i + 1} of ${totalVideos}…`,
                    })

                    const task = await tl_client.tasks.create({
                        indexId: indexId,
                        videoUrl: videoURL,
                        userMetadata: JSON.stringify(metadata)
                    })
                    console.log(`[DEBUG] Created task:`, JSON.stringify(task, null, 2));

                    send('progress', {
                        completed: i,
                        total: totalVideos,
                        percent: Math.round(((i + 0.5) / totalVideos) * 100),
                        message: `Waiting for TwelveLabs to process video ${i + 1}…`,
                    })

                    const completedTask = await tl_client.tasks.waitForDone(task.id, {
                        sleepInterval: 5
                    })
                    console.log(`[DEBUG] Task finished waiting:`, JSON.stringify(completedTask, null, 2));

                    // Fallback in case waitForDone returns void/null, though it usually returns the task
                    const finalTask = completedTask || await tl_client.tasks.retrieve(task.id);

                    if (finalTask.status !== "ready") {
                        throw new Error(`Task ${finalTask.id} failed with status ${finalTask.status}`)
                    }

                    console.log(`Task ${finalTask.id} completed with status ${finalTask.status} and video ID ${finalTask.videoId}`)

                    const retrieveTask = await fetch(`https://api.twelvelabs.io/v1.3/indexes/${indexId}/videos/${finalTask.videoId}`, {
                        method: "GET",
                        headers: {
                            "x-api-key": process.env.TL_API_KEY,
                            "transcription": "true"
                        }
                    })

                    const retrievedVideoData = await retrieveTask.json()

                    const result = {
                        videoId: finalTask.videoId,
                        videoUrl: videoURL,
                        userMetadata: retrievedVideoData.user_metadata,
                        transcription: retrievedVideoData.transcription
                    }

                    videoData.push(result)

                    send('video_done', {
                        index: i,
                        completed: i + 1,
                        total: totalVideos,
                        percent: Math.round(((i + 1) / totalVideos) * 100),
                        video: result,
                    })

                } catch (err) {
                    send('video_error', {
                        index: i,
                        videoUrl: videoURL,
                        error: err.message,
                        completed: i,
                        total: totalVideos,
                        percent: Math.round(((i + 1) / totalVideos) * 100),
                    })
                }
            }

            send('complete', {
                completed: totalVideos,
                total: totalVideos,
                percent: 100,
                videos: videoData,
            })

            controller.close()
        }
    })

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    })
}