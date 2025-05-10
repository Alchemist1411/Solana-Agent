import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from 'uuid';
import { agentBuilder } from "../ai-node";
import mongoose from 'mongoose';
import Session from "../models/schema";
import dotenv from "dotenv";

dotenv.config();

const router = Router();
const MESSAGE_LIMIT = 40;

mongoose.connect(process.env.MONGODB_URI || "")
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

router.post('/chat', async (req: any, res: any) => {
  const { userId, content, threadId } = req.body;

  if (!userId || !content) {
    return res.status(400).json({ error: 'UserId and content are required' });
  }

  let session;

  if (threadId) {
    session = await Session.findOne({ threadId });
  }

  if (!session) {
    session = await Session.findOne({ userId });
  }

  if (!session) {
    const newThreadId = uuidv4();
    session = new Session({
      userId,
      threadId: newThreadId,
      conversationHistory: []
    });
  }

  session.conversationHistory.push({
    role: "user",
    content,
    timestamp: new Date()
  });

  try {
    const result = await agentBuilder.invoke({
      messages: session.conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    });

    const last_message = result.messages[result.messages.length - 1];

    session.conversationHistory.push({
      role: "assistant",
      content: last_message.content,
      timestamp: new Date()
    });

    if (session.conversationHistory.length > MESSAGE_LIMIT) {
      const itemsToRemove = session.conversationHistory.length - MESSAGE_LIMIT;
      for (let i = 0; i < itemsToRemove; i++) {
        session.conversationHistory.shift();
      }
    }

    session.lastAccessed = new Date();

    await session.save();

    const additional_kwargs = last_message?.additional_kwargs || {};
    console.log("Additional Kwargs:", additional_kwargs);

    const toolCall = additional_kwargs.toolCall;
    const tool_names = toolCall && typeof toolCall === 'object' && 'name' in toolCall ? toolCall.name : null;
    const ui_type = toolCall && typeof toolCall === 'object' && 'uiType' in toolCall ? toolCall.uiType : "text";
    const amount = additional_kwargs.amount || null;
    const walletAddress = additional_kwargs.walletAddress || null;
    const token = additional_kwargs.token || null;
    const trxn = additional_kwargs.trxn || null;
    const contractAddress = additional_kwargs.contractAddress || null;
    const decentralisationScore = additional_kwargs.decentralisationScore || null;

    res.json({
      threadId: session.threadId,
      messages: last_message.content,
      uiType: ui_type,
      tool_calls: tool_names,
      amount: amount,
      walletAddress: walletAddress,
      token: token,
      trxn: trxn,
      contractAddress: contractAddress,
      decentralisationScore: decentralisationScore
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