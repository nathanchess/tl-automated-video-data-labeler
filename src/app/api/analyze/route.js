import { TwelveLabs, TwelvelabsApiError } from "twelvelabs-js";
import { NextResponse } from "next/server";

// Match long-running analyze (Vercel Pro / self-hosted). Hobby still caps at 60s.
export const maxDuration = 600;

/**
 * twelvelabs-js serializers expect camelCase on the in-memory object; wire keys are applied
 * when building the JSON body. Passing response_format / json_schema from fetch() gets stripped.
 * @see node_modules/twelvelabs-js/serialization/client/requests/AnalyzeRequest.js
 */
function normalizeResponseFormat(rf) {
    if (!rf || typeof rf !== "object") return undefined;
    const jsonSchema = rf.jsonSchema ?? rf.json_schema;
    if (!jsonSchema) return undefined;
    return {
        type: "json_schema",
        jsonSchema,
    };
}

export async function POST(request) {
    const tl_client = new TwelveLabs({ apiKey: process.env.TL_API_KEY });

    const body = await request.json();
    const {
        videoId,
        prompt,
        response_format,
        responseFormat,
        startSec,
        endSec,
        temperature,
        maxTokens,
        max_tokens,
    } = body;

    if (!videoId) {
        return NextResponse.json({ error: "Video ID is required" }, { status: 400 });
    }

    if (!prompt) {
        return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const parameters = {
        videoId,
        prompt,
        // Working ad-plan route uses 0.1; allow override from client.
        temperature: temperature ?? 0.1,
    };

    const rf = normalizeResponseFormat(responseFormat ?? response_format);
    if (rf) {
        parameters.responseFormat = rf;
        // Explicit cap avoids truncated JSON on dense schemas (matches working chunk calls).
        parameters.maxTokens = maxTokens ?? max_tokens ?? 4096;
    } else if (maxTokens != null || max_tokens != null) {
        parameters.maxTokens = maxTokens ?? max_tokens;
    }

    // Optional time window — only sent if this SDK version includes them in AnalyzeRequest
    // (older twelvelabs-js may strip unknown keys; chunking still works via prompt text).
    if (startSec != null && startSec >= 0) {
        parameters.startSec = Math.floor(startSec);
    }
    if (endSec != null && endSec > 0) {
        parameters.endSec = Math.ceil(endSec);
    }

    console.log(`[analyze] videoId=${videoId} startSec=${startSec ?? "all"} endSec=${endSec ?? "all"}`);

    const timeoutSec =
        Number(process.env.TL_ANALYZE_TIMEOUT_SEC) > 0
            ? Math.min(Number(process.env.TL_ANALYZE_TIMEOUT_SEC), maxDuration)
            : maxDuration;

    try {
        const result = await tl_client.analyze(parameters, { timeoutInSeconds: timeoutSec });

        console.log(result);

        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        if (error instanceof TwelvelabsApiError && error.statusCode === 429) {
            const body = error.body && typeof error.body === "object" ? error.body : {};
            return NextResponse.json(
                {
                    code: body.code ?? "too_many_requests",
                    message:
                        typeof body.message === "string"
                            ? body.message
                            : "Rate limit exceeded. Please try again later.",
                },
                { status: 429 }
            );
        }
        console.error("[analyze]", error);
        const status =
            error instanceof TwelvelabsApiError && typeof error.statusCode === "number"
                ? error.statusCode
                : 500;
        const msg =
            error instanceof Error ? error.message : "Analysis failed";
        return NextResponse.json({ error: msg }, { status: status >= 400 && status < 600 ? status : 500 });
    }
}
