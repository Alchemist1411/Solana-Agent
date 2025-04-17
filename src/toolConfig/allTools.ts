import llm from "../createInstance";
import getSolAirdrop from "../tools/getSolAirdrop";
import messariTool from "../tools/messariChat";
import messariROITool from "../tools/messariROI";

export const tools = [getSolAirdrop, messariTool, messariROITool];
export const toolsByName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));
export const llmWithTools = llm.bindTools(tools);