import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { llmWithTools, toolsByName } from "./toolConfig/allTools";
import {
    ToolMessage
} from "@langchain/core/messages";
import { systemPrompt } from "./utils/systemPrompt";

let toolDataMap: Map<string, string> = new Map();
let walletAddress: string = "";
let amount: string = "";
let token: string = "";
let toolcall: any = "";
let trxn: string = "";
let prediction: any = "";


async function llmCall(state: any) {
    if (state.messages.length === 1 || state.messages[state.messages.length - 1].role === "user") {
        toolDataMap = new Map();
        walletAddress = "";
        amount = "";
        token = "";
        toolcall = "";
        trxn = "";
        prediction = "";
    }

    const result = await llmWithTools.invoke([
        {
            role: "system",
            content: systemPrompt,
        },
        ...state.messages
    ]);

    result.additional_kwargs = {
        uiType: Array.from(toolDataMap.values()),
        toolCall: toolcall,
        walletAddress: walletAddress,
        amount: amount,
        token: token,
        trxn: trxn,
        prediction: prediction
    };

    return { messages: result };
}

async function toolNode(state: any) {
    const results: ToolMessage[] = [];
    const lastMessage = state.messages.at(-1);

    if (lastMessage?.tool_calls?.length) {
        for (const toolCall of lastMessage.tool_calls) {
            const tool = toolsByName[toolCall.name];
            const observation = await tool.invoke(toolCall.args);
            results.push(
                new ToolMessage({
                    content: observation.text,
                    tool_call_id: toolCall.id,
                    additional_kwargs: {
                        toolName: tool.name,
                        uiType: observation.uiType,
                        amount: observation.amount,
                        walletAddress: observation.walletAddress,
                        token: observation.token,
                        trxn: observation.trxn,
                        prediction: observation.prediction
                    }
                })
            );
            toolDataMap.set(tool.name, observation.uiType);
            toolcall = { ...toolCall, uiType: observation.uiType };
            walletAddress = observation.walletAddress;
            amount = observation.amount;
            token = observation.token;
            trxn = observation.trxn;
            prediction = observation.prediction;
        }
    }

    return { messages: results };
}

function shouldContinue(state: any) {
    const messages = state.messages;
    const lastMessage = messages.at(-1);

    if (lastMessage?.tool_calls?.length) {
        return "Action";
    }

    return "__end__";
}

export const agentBuilder = new StateGraph(MessagesAnnotation)
    .addNode("llmCall", llmCall)
    .addNode("tools", toolNode)
    .addEdge("__start__", "llmCall")
    .addConditionalEdges(
        "llmCall",
        shouldContinue,
        {
            "Action": "tools",
            "__end__": "__end__",
        }
    )
    .addEdge("tools", "llmCall")
    .compile();
