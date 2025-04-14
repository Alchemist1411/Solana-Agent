import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from 'uuid';
import { agentBuilder } from "../ai-node";
import mongoose from 'mongoose';
import Session from "../models/schema";
import dotenv from "dotenv";

dotenv.config();

const router = Router();
const MESSAGE_LIMIT = 20;

mongoose.connect(process.env.MONGODB_URI || "");

router.post('/chat', async (req: any, res: any) => {
  const { userId, content, threadId } = req.body;

  if (!userId || !content) {
    return res.status(400).json({ error: 'UserId and content are required' });
  }

  let currentThreadId = threadId || uuidv4();
  let session = await Session.findOne({ threadId: currentThreadId });

  if (!session) {
    session = new Session({ userId, threadId: currentThreadId, messages: [], aiResponses: [] });
  }

  session.messages.push({ role: "user", content });

  try {
    console.log(`Messages before invoking agentBuilder for thread ${currentThreadId}:`, session.messages);

    const result = await agentBuilder.invoke({ messages: session.messages });

    console.log(`Messages after invoking agentBuilder for thread ${currentThreadId}:`, result.messages);

    session.aiResponses.push({ role: "assistant", response: result.messages });

    session.messages = session.messages.slice(-MESSAGE_LIMIT);
    await session.save();

    const last_message = result.messages[result.messages.length - 1];
    const additional_kwargs = last_message?.additional_kwargs || {};

    console.log("Additional Kwargs:", additional_kwargs);

    const toolCall = additional_kwargs.toolCall;
    const tool_names = toolCall && typeof toolCall === 'object' && 'name' in toolCall ? toolCall.name : null;
    const ui_type = toolCall && typeof toolCall === 'object' && 'uiType' in toolCall ? toolCall.uiType : "text";
    const amount = additional_kwargs.amount || null;
    const walletAddress = additional_kwargs.walletAddress || null;
    const token = additional_kwargs.token || null;
    const trxn = additional_kwargs.trxn || null;
    const prediction = additional_kwargs.prediction || null;

    res.json({
      threadId: currentThreadId,
      messages: last_message.content,
      uiType: ui_type,
      tool_calls: tool_names,
      amount: amount,
      walletAddress: walletAddress,
      token: token,
      trxn: trxn,
      prediction: prediction
    });

  } catch (error) {
    console.error('Error occurred while processing the request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post("/dummy_chat", async (req: Request, res: Response) => {
  const content = req.body.content;
  try {
    const responseMessage = {
      uiType: "text",
      messages: `${content} agent dummy chat response`,
      threadId: "1234"
    };
    res.json(responseMessage);
    console.log("Dummy chat response sent", responseMessage);
  } catch (error: any) {
    res.status(500).send(`Error: ${error.message}`);
  }
});

export default router;