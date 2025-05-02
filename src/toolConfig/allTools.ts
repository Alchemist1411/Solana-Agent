import llm from "../createInstance";
import getCexSupplytool from "../tools/getCexSupply";
import getSolanaContractAddress from "../tools/getContractAddress";
import getcontractsupplytool from "../tools/getcontractSupply";
import getDecentralisationScoretool from "../tools/getDecentralisation_score";
import getSolAirdrop from "../tools/getSolAirdrop";
import rugCheckTool from "../tools/rugCheckTool";
import sendSolTool from "../tools/sendSol";

export const tools = [getSolAirdrop, rugCheckTool, sendSolTool,getSolanaContractAddress,getDecentralisationScoretool,getCexSupplytool,getcontractsupplytool];
export const toolsByName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));
export const llmWithTools = llm.bindTools(tools);