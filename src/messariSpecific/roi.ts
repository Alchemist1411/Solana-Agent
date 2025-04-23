import { MessariClient, LogLevel } from "@messari/sdk";
import dotenv from "dotenv";

dotenv.config();

const client = new MessariClient({
    apiKey: process.env.MESSARI_API || "",
    logLevel: LogLevel.INFO,
});

export async function getAssetsROIInfo() {
    try {
        const response = await client.asset.getAssetsV2ROI({ limit: 20 });
        const assetsWithValidROI = response.data
            .filter((asset) => asset.returnOnInvestment)
            .slice(0, 20)
            .map((asset) => {
                const roi = asset.returnOnInvestment;
                return {
                    name: asset.name,
                    symbol: asset.symbol,
                    roi: {
                        "24h": roi?.priceChange24h ?? null,
                        "7d": roi?.priceChange7d ?? null,
                        "30d": roi?.priceChange30d ?? null,
                        "YTD": roi?.priceChangeYTD ?? null,
                        "1y": roi?.priceChange1y ?? null,
                    },
                };
            });
        return assetsWithValidROI;
    } catch (error) {
        throw error;
    }
}