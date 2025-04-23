import { MessariClient } from "@messari/sdk";
import type { getNewsFeedParameters, getNewsFeedAssetsParameters, getNewsSourcesParameters } from "@messari/sdk";
import dotenv from "dotenv";

dotenv.config();

const client = new MessariClient({
  apiKey: process.env.MESSARI_API || "",
});

export async function getNewsFeed(page = 1, limit = 10) {
  const params: getNewsFeedParameters = {
    publishedAfter: Date.now() - 7 * 24 * 60 * 60 * 1000,
    sourceTypes: ["News"],
    sort: 2,
    limit,
    page,
  };
  const paginatedArticles = await client.news.getNewsFeedPaginated(params);
  return {
    metadata: paginatedArticles.metadata,
    articles: paginatedArticles.data.map(article => ({
      title: article.title,
      publishTime: article.publishTimeMillis,
      source: article.source?.sourceName,
      assets: article.assets?.map(a => a.name),
      url: article.url,
    })),
  };
}