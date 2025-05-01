import { Router } from "express";
import { MessariClient } from "@messari/sdk";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const router = Router();

const client = new MessariClient({
    apiKey: process.env.MESSARI_API || "",
});

router.post("/chat", async (req: any, res: any) => {
    const { prompt, stream } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
    }

    try {
        if (stream) {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");

            const response = await client.ai.createChatCompletionStream({
                messages: [{ role: "user", content: prompt }],
                verbosity: "succinct",
                response_format: "plaintext",
                inline_citations: false,
            });

            for await (const chunk of response) {
                if (chunk.choices.length > 0 && chunk.choices[0].delta?.content) {
                    res.write(`data: ${chunk.choices[0].delta.content}\n\n`);
                }
            }
            res.end();
        } else {
            const response = await client.ai.createChatCompletion({
                messages: [{ role: "user", content: prompt }],
                verbosity: "succinct",
                response_format: "plaintext",
                inline_citations: false,
            });

            res.json({
                threadId: uuidv4(),
                messages: response.choices?.[0]?.message?.content || "",
                uiType: "text",
                toolCall: "messariChat"
            });
        }
    } catch (error) {
        console.error("Error calling Messari AI:", error);
        res.status(500).json({ error: "Failed to get response from Messari AI." });
    }
});

export default router;
