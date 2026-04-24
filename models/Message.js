import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  room: {
    type: String,
    required: true,
    index: true,
  },
  sender: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  replyTo: {
    messageId: { type: String },
    sender: { type: String },
    text: { type: String }
  }
});

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
