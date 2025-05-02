import { tool } from "@langchain/core/tools";
import axios from "axios";
import { z } from "zod";

const tokenNameSchema = z.object({
    tokenName: z.string().describe("The name of the token to get the Cex supply."),
});

interface ContractAddressResult {
    text: string;
}

async function getcontractScore(tokenName: string): Promise<ContractAddressResult> {
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

        const supplyCex = score.data.identified_supply.percent_in_contracts;

        if (supplyCex) {
            return {
                text: `Contract supply score for ${tokenName}: ${supplyCex}`
            };
        } else {
            console.error(`No Solana contract address found for ${tokenName}.`);
            return { text: `No Solana contract address found for ${tokenName}.` };
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

const getcontractsupplytool = tool(
    async ({ tokenName }) => {
        try {
            const result = await getcontractScore(tokenName);
            return {
                uiType: "text",
                text: result.text
            };
        } catch (error) {
            console.error("Error in getting contract supply:", error);
            return {
                uiType: "text",
                text: `Error in getting contract supply for ${tokenName}: ${error}`
            };
        }
    },
    {
        name: "getcontractsupplytool",
        description: "Get the contract supply for specified token name using Bubble ",
        schema: tokenNameSchema,
    }
);

export default getcontractsupplytool;