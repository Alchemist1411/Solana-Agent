import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from 'dotenv';

dotenv.config();

const llm = new ChatOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  modelName: "gpt-4o",
});

export default llm;