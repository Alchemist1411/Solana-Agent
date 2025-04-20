import { tool } from "@langchain/core/tools";
import axios from "axios";
import * as dotenv from 'dotenv';
import { z } from "zod";

dotenv.config();

const rugCheckSchema = z.object({
    tokenMintAddress: z.string().describe("The Solana token mint address to check for potential rug pulls or scams"),
});

const rugCheckTool = tool(
    async ({ tokenMintAddress }: { tokenMintAddress: string }) => {
        try {
            const response = await axios.get(`https://api.rugcheck.xyz/v1/tokens/${tokenMintAddress}/report/summary`);

            if (response.data) {
                const data = response.data;

                let formattedResponse = `# RugCheck Report for ${tokenMintAddress}\n\n`;

                if (data.token_name) {
                    formattedResponse += `**Token Name:** ${data.token_name}\n`;
                }

                if (data.token_symbol) {
                    formattedResponse += `**Token Symbol:** ${data.token_symbol}\n`;
                }

                if (data.risk_score !== undefined) {
                    formattedResponse += `**Risk Score:** ${data.risk_score}/100\n`;
                }

                if (data.risk_level) {
                    formattedResponse += `**Risk Level:** ${data.risk_level}\n`;
                }

                if (data.summary) {
                    formattedResponse += `\n## Summary\n${data.summary}\n`;
                }

                if (data.explanation) {
                    formattedResponse += `\n## Detailed Explanation\n${data.explanation}\n`;
                }

                if (data.warnings && data.warnings.length > 0) {
                    formattedResponse += `\n## Warnings\n`;
                    data.warnings.forEach((warning: string) => {
                        formattedResponse += `- ${warning}\n`;
                    });
                }

                if (data.metrics) {
                    formattedResponse += `\n## Key Metrics\n`;
                    Object.entries(data.metrics).forEach(([key, value]) => {
                        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        formattedResponse += `- **${formattedKey}:** ${value}\n`;
                    });
                }

                if (data.contract_details) {
                    formattedResponse += `\n## Contract Details\n`;
                    Object.entries(data.contract_details || {}).forEach(([key, value]) => {
                        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        formattedResponse += `- **${formattedKey}:** ${value}\n`;
                    });
                }

                if (data.checks) {
                    formattedResponse += `\n## Security Checks\n`;
                    Object.entries(data.checks || {}).forEach(([key, value]) => {
                        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        formattedResponse += `- **${formattedKey}:** ${value}\n`;
                    });
                }

                if (data.recommendations) {
                    formattedResponse += `\n## Recommendations\n`;
                    if (Array.isArray(data.recommendations)) {
                        data.recommendations.forEach((rec: string) => {
                            formattedResponse += `- ${rec}\n`;
                        });
                    } else {
                        formattedResponse += data.recommendations;
                    }
                }

                formattedResponse += `\n## Additional Data\n`;
                Object.entries(data).forEach(([key, value]) => {
                    const handledKeys = ['token_name', 'token_symbol', 'risk_score', 'risk_level',
                        'warnings', 'metrics', 'contract_details', 'checks',
                        'recommendations', 'summary', 'explanation'];

                    if (!handledKeys.includes(key) && value !== null && value !== undefined) {
                        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                        if (typeof value === 'object') {
                            formattedResponse += `- **${formattedKey}:** ${JSON.stringify(value)}\n`;
                        } else {
                            formattedResponse += `- **${formattedKey}:** ${value}\n`;
                        }
                    }
                });

                formattedResponse += `\n\n**Debug - Full API Response:**\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;

                return {
                    uiType: "text",
                    text: formattedResponse,
                    token: tokenMintAddress
                };
            } else {
                return {
                    uiType: "text",
                    text: `No data available for token mint address: ${tokenMintAddress}`,
                    token: tokenMintAddress
                };
            }
        } catch (error: any) {
            console.error('RugCheck API error:', error);

            let errorMessage = error.message;
            if (error.response) {
                const status = error.response.status;
                if (status === 404) {
                    errorMessage = `Token mint address not found: ${tokenMintAddress}`;
                } else if (status === 429) {
                    errorMessage = "Rate limit exceeded. Please try again later.";
                } else if (error.response.data && error.response.data.error) {
                    errorMessage = error.response.data.error;
                }
            }

            return {
                uiType: "text",
                text: `Failed to perform rug check: ${errorMessage}`,
                token: tokenMintAddress
            };
        }
    },
    {
        name: "rugCheck",
        description: "Check a Solana token's safety and legitimacy by its mint address using RugCheck",
        schema: rugCheckSchema,
    }
);

export default rugCheckTool;