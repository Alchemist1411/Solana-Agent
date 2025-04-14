import { tool } from "@langchain/core/tools";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { z } from "zod";

const solAirdropSchema = z.object({
    walletAddress: z.string().describe("The Solana wallet address to get the airdrop status for."),
    amount: z.number().describe("The amount of SOL to airdrop."),
});

const getSolAirdrop = tool(
    async ({ walletAddress, amount }: { walletAddress: string; amount: number }) => {
        try {
            const connection = new Connection("https://api.devnet.solana.com");
            const signature = await connection.requestAirdrop(
                new PublicKey(walletAddress),
                LAMPORTS_PER_SOL * amount
            );
            return {
                uiType: "text",
                text: `The airdrop status for wallet ${walletAddress} is: ${signature}.`,
                walletAddress: walletAddress,
                amount: amount,
                airdropStatus: signature,
            };
        } catch (error: any) {
            return {
                uiType: "text",
                text: `Failed to get airdrop status for wallet ${walletAddress}: ${error.message}`,
            };
        }
    },
    {
        name: "getSolAirdrop",
        description: "Get the airdrop status of a Solana wallet address.",
        schema: solAirdropSchema,
    }
);

export default getSolAirdrop;