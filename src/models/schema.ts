import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const sessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  threadId: { type: String, required: true, unique: true },
  lastAccessed: { type: Date, default: Date.now },
  conversationHistory: [messageSchema]
});

sessionSchema.index({ userId: 1, lastAccessed: -1 });

const Session = mongoose.model('Session', sessionSchema);

export default Session;