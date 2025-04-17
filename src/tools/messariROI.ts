import { tool } from "@langchain/core/tools";
import axios from "axios";
import * as dotenv from 'dotenv';
import { z } from "zod";

dotenv.config();

const messariROISchema = z.object({
    assets: z.string().describe("Comma-separated list of asset slugs (e.g., 'bitcoin,ethereum,solana') to get ROI data for"),
    timeframe: z.enum(["1d", "7d", "30d", "90d", "1y", "3y", "5y"]).optional()
        .describe("Time period for ROI calculation (default: 1y)")
});

const messariROITool = tool(
    async ({ assets, timeframe }: { assets: string; timeframe?: string }) => {
        try {
            const messariApiKey = process.env.MESSARI_API;

            if (!messariApiKey) {
                throw new Error("Messari API key is not configured");
            }

            const assetSlugs = assets.split(',').map(slug => slug.trim()).join(',');
            const finalTimeframe = timeframe || "1y";

            let url = `https://api.messari.io/metrics/v2/assets/roi`;

            // Add query parameters
            const params = new URLSearchParams();
            params.append('assets', assetSlugs);
            params.append('timeframe', finalTimeframe);

            // Append params to URL
            url = `${url}?${params.toString()}`;

            const response = await axios.get(url, {
                headers: {
                    'x-messari-api-key': messariApiKey
                }
            });

            let formattedResponse = "";

            if (response.data.data && Array.isArray(response.data.data)) {
                formattedResponse = response.data.data.map((assetData: any) => {
                    const symbol = assetData.symbol || "Unknown";
                    const name = assetData.name || "Unknown";

                    let roiDetails = "";
                    if (assetData.roi_data) {
                        const roi = assetData.roi_data;
                        roiDetails = Object.entries(roi)
                            .map(([period, value]: [string, any]) => {
                                if (typeof value === 'number') {
                                    return `${period}: ${(value * 100).toFixed(2)}%`;
                                }
                                return null;
                            })
                            .filter(item => item !== null)
                            .join(", ");
                    }

                    return `**${name} (${symbol})**: ${roiDetails}`;
                }).join("\n\n");
            } else if (response.data.data) {
                const assetData = response.data.data;
                const symbol = assetData.symbol || "Unknown";
                const name = assetData.name || "Unknown";

                formattedResponse = `**${name} (${symbol})**\n`;

                if (assetData.roi_data) {
                    const roi = assetData.roi_data;
                    formattedResponse += Object.entries(roi)
                        .map(([period, value]: [string, any]) => {
                            if (typeof value === 'number') {
                                return `${period}: ${(value * 100).toFixed(2)}%`;
                            }
                            return null;
                        })
                        .filter(item => item !== null)
                        .join("\n");
                }
            }

            if (!formattedResponse) {
                formattedResponse = "No ROI data available for the specified assets.";
            }

            return {
                uiType: "text",
                text: formattedResponse,
            };
        } catch (error: any) {
            console.error('Messari ROI API error:', error);

            const errorMessage = error.response?.data?.status?.error_message || error.message;
            return {
                uiType: "text",
                text: `Failed to get ROI data from Messari: ${errorMessage}`,
            };
        }
    },
    {
        name: "messariROI",
        description: "Get Return-on-Investment (ROI) data for specified cryptocurrency assets using the Messari API",
        schema: messariROISchema,
    }
);

export default messariROITool;