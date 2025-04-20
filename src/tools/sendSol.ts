import { tool } from "@langchain/core/tools";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { z } from "zod";
import * as dotenv from 'dotenv';

dotenv.config();

const sendSolSchema = z.object({
    userId: z.string().describe("The sender's wallet address (public key)"),
    recipientAddress: z.string().describe("The recipient's wallet address to send SOL to"),
    amount: z.number().describe("The amount of SOL to send"),
});

const isValidSolanaAddress = (address: string): boolean => {
    try {
        new PublicKey(address.trim());
        return true;
    } catch {
        return false;
    }
};

const sendSolTool = tool(
    async ({ userId, recipientAddress, amount }: { userId: string; recipientAddress: string; amount: number }) => {
        try {
            console.log("sendSolTool input:", { userId, recipientAddress, amount }); // Debug log
            if (!userId || !userId.trim()) throw new Error("Sender address (userId) is missing.");
            if (!recipientAddress) throw new Error("Recipient address is missing.");
            if (amount === undefined || amount === null) throw new Error("Amount is missing.");
            if (!isValidSolanaAddress(userId)) {
                throw new Error(`Invalid sender address: ${userId}`);
            }
            if (!isValidSolanaAddress(recipientAddress)) {
                throw new Error(`Invalid recipient address: ${recipientAddress}`);
            }
            if (amount <= 0) {
                throw new Error("Amount must be greater than zero.");
            }

            console.log("sendSolTool input:", { userId, recipientAddress, amount });

            const connection = new Connection("https://api.devnet.solana.com");
            const senderPubKey = new PublicKey(userId.trim());
            const recipientPubKey = new PublicKey(recipientAddress.trim());

            const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

            const transaction = new Transaction({
                feePayer: senderPubKey,
                blockhash,
                lastValidBlockHeight,
            }).add(
                SystemProgram.transfer({
                    fromPubkey: senderPubKey,
                    toPubkey: recipientPubKey,
                    lamports: Math.round(LAMPORTS_PER_SOL * amount),
                })
            );

            const serializedTransaction = transaction.serialize({
                requireAllSignatures: false,
                verifySignatures: false,
            }).toString('base64');

            return {
                uiType: "signTx",
                text: `Transaction created to send ${amount} SOL from ${userId} to ${recipientAddress}. Please sign the transaction to complete.`,
                serializedTransaction,
                walletAddress: userId,
                recipientAddress,
                amount,
                trxn: serializedTransaction,
            };
        } catch (error: any) {
            return {
                uiType: "signTx",
                text: `Failed to create SOL transfer transaction: ${error.message}`,
            };
        }
    },
    {
        name: "sendSol",
        description: "Send SOL to recipient address",
        schema: sendSolSchema,
    }
);

export default sendSolTool;