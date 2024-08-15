import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserChatSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
  status: { type: String, enum: ['banned', 'active', 'muted'], default: 'active' },
  // totalUnread: { type: Number, default: 0 }, // doesnt scale beacuse anytime a chat has a new msg,
  // I'd have to query all the documents here from that chat, and add 1 to each document
  // better to have something 'client orgininated'. Like lastReadTimestamp or lastReadMessage
  // lastReadAt: { type: Date, default: Date.now },
  lastReadMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
  isOpened: { type: Boolean, default: true }
}, {
  methods : {
    // isMemberInGroup(userId) {
    //   const out = this.members.some(m => m.user.equals(userId));
    //   return out;
    // }
  },
  statics: {
    
  }
});

const UserChat = mongoose.model('UserChat', UserChatSchema);
export default UserChat;