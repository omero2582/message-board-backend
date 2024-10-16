import mongoose from "mongoose";

const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  content: { type: String, required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
}, {
  timestamps: true,
})

const Message = mongoose.model('Message', MessageSchema);
export default Message;