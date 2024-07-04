import mongoose from "mongoose";

const Schema = mongoose.Schema;

const ChatSchema = new Schema({
  name: { type: String, required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  isGlobal: { type: Boolean, default: false },
  isGroupChat: { type: Boolean, default: false }
});

ChatSchema.pre('validate', async function (next) {
  console.log('Chat validation midelware');
  if(this.isGlobal || this.isGroupChat){
    this.isGlobal = true;
    this.isGroupChat = true;
  }
  next();
});

ChatSchema.methods.isMemberInGroup = function (userId) {
  return this.isGlobal || this.members.some(m => m.id === userId);
};

const Chat = mongoose.model('Chat', ChatSchema);
export default Chat;