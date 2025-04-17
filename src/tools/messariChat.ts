import { tool } from "@langchain/core/tools";
import axios from "axios";
import * as dotenv from 'dotenv';
import { z } from "zod";

dotenv.config();

const messariSchema = z.object({
    query: z.string().describe("The cryptocurrency question or query to ask Messari AI"),
});

const messariTool = tool(
    async ({ query }: { query: string }) => {
        try {
            const messariApiKey = process.env.MESSARI_API;

            if (!messariApiKey) {
                throw new Error("Messari API key is not configured");
            }

            const response = await axios.post(
                'https://api.messari.io/ai/v1/chat/completions',
                {
                    messages: [
                        {
                            role: "user",
                            content: query
                        }
                    ],
                    verbosity: "succinct",
                    response_format: "markdown"
                },
                {
                    headers: {
                        'x-messari-api-key': messariApiKey,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data && response.data.choices && response.data.choices.length > 0 &&
                response.data.choices[0].message && response.data.choices[0].message.content) {
                return {
                    uiType: "text",
                    text: response.data.choices[0].message.content,
                };
            } else if (response.data && response.data.content) {
                return {
                    uiType: "text",
                    text: response.data.content,
                };
            } else {
                const responseText = JSON.stringify(response.data);
                return {
                    uiType: "text",
                    text: `Received response from Messari: ${responseText}`,
                };
            }
        } catch (error: any) {
            console.error('Messari API error:', error);

            if (error.response) {
                console.error('Error response data:', error.response.data);
                console.error('Error response status:', error.response.status);
                console.error('Error response headers:', error.response.headers);
            }

            return {
                uiType: "text",
                text: `Failed to get information from Messari: ${error.message}`,
            };
        }
    },
    {
        name: "messariChat",
        description: "Get cryptocurrency information and answers from Messari AI",
        schema: messariSchema,
    }
);

export default messariTool;