import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  userId: { type: String, required: true},
  threadId: { type: String, required: true, unique: true },
  messages: { type: Array, required: true },
  aiResponses: { type: Array, default: [] },
});

sessionSchema.index({ userId: 1 });

const Session = mongoose.model('Session', sessionSchema);

export default Session;