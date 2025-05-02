import { tool } from "@langchain/core/tools";
import axios from "axios";
import { z } from "zod";

const tokenNameSchema = z.object({
    tokenName: z.string().describe("The name of the token to get the Decentralisation score."),
});

interface ContractAddressResult {
    text: string;
    decentralisationScore?: number;
}

async function getDecentralisationScore(tokenName: string): Promise<ContractAddressResult> {
    try {
        const url = 'https://api.coingecko.com/api/v3/coins/list?include_platform=true';
        const response = await axios.get(url);
        const coins = response.data;
        const token = coins.find(
            (coin: any) => coin.name.toLowerCase() === tokenName.toLowerCase()
        );

        if (!token) {
            console.error(`Token "${tokenName}" not found in CoinGecko list.`);
            return { text: `Token "${tokenName}" not found in CoinGecko list.` };
        }

        const id = token.id;
        const coinData = await axios.get(`https://api.coingecko.com/api/v3/coins/${id}`);
        const solanaAddress = coinData.data.platforms?.solana;

        const score = await axios.get(`https://api-legacy.bubblemaps.io/map-metadata?chain=sol&token=${solanaAddress}`);

        const decentralisationScore = score.data.decentralisation_score;

        if (decentralisationScore) {
            return {
                text: `Decentralisation score for ${tokenName}: ${decentralisationScore}`,
                decentralisationScore: decentralisationScore,
            };
        } else {
            return { text: `No Decentralised score for ${tokenName}` };
        }
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error fetching coin details:", error.message);
            return { text: `Error fetching coin details: ${error.message}` };
        } else {
            console.error("Unknown error occurred.");
            return { text: "Unknown error occurred." };
        }
    }
}

const getDecentralisationScoretool = tool(
    async ({ tokenName }) => {
        try {
            const result = await getDecentralisationScore(tokenName);
            return {
                uiType: "text",
                text: result.text,
                decentralisationScore: result.decentralisationScore || null, 
            };
        } catch (error) {
            console.error("Error in getting Decentralised score:", error);
            return {
                uiType: "text",
                text: `Error in getting Decentralised score for ${tokenName}: ${error}`,
                decentralisationScore: null,
            };
        }
    },
    {
        name: "getDecentralisationScoretool",
        description: "Get the decentralised score for specified token name using Bubble ",
        schema: tokenNameSchema,
    }
);

export default getDecentralisationScoretool;