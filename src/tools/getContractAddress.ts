import { tool } from "@langchain/core/tools";
import axios from "axios";
import { z } from "zod";

const tokenNameSchema = z.object({
    tokenName: z.string().describe("The name of the token to get the Solana contract address for."),
});

interface ContractAddressResult {
    text: string;
    address?: string; 
}

async function getContractAddress(tokenName: string): Promise<ContractAddressResult> {
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

        if (solanaAddress) {
            console.log(`Solana contract address for ${tokenName}: ${solanaAddress}`);
            return {
                text: `Solana contract address for ${tokenName}: ${solanaAddress}`,
                address: solanaAddress,
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

const getSolanaContractAddress = tool(
    async ({ tokenName }) => {
        try {
            const result = await getContractAddress(tokenName);
            return {
                uiType: "bubble_chart",
                text: result.text,
                contractAddress: result.address || null, 
            };
        } catch (error) {
            console.error("Error in getContractAddress:", error);
            return {
                uiType: "text",
                text: `Error in getContractAddress: ${error}`,
                contractAddress: null,
            };
        }
    },
    {
        name: "getSolanaContractAddress",
        description: "Get the Solana contract address for a specified token name using CoinGecko data.",
        schema: tokenNameSchema,
    }
);

export default getSolanaContractAddress;