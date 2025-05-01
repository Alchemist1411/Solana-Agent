import llm from "../createInstance";
import getSolanaContractAddress from "../tools/getContractAddress";
import getSolAirdrop from "../tools/getSolAirdrop";
import rugCheckTool from "../tools/rugCheckTool";
import sendSolTool from "../tools/sendSol";

export const tools = [getSolAirdrop, rugCheckTool, sendSolTool,getSolanaContractAddress];
export const toolsByName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));
export const llmWithTools = llm.bindTools(tools);