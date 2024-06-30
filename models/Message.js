import mongoose from "mongoose";

const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recipients: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  group: { type: Schema.Types.ObjectId, ref: 'Group', required: false },
  content: { type: String, required: true },
}, {timestamps: true})

const Message = mongoose.model('Message', MessageSchema);
export default Message;