import llm from "../createInstance";
import getSolAirdrop from "../tools/getSolAirdrop";

export const tools = [getSolAirdrop];
export const toolsByName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));
export const llmWithTools = llm.bindTools(tools);