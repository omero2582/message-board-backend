import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserChatSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User'},
  chat: { type: Schema.Types.ObjectId, ref: 'Chat' },
  // totalUnread: { type: Number, default: 0 }, // doesnt scale beacuse anytime a chat has a new msg,
  // I'd have to query all the documents here from that chat, and add 1 to each document
  // better to have something 'client orgininated'. Like lastReadTimestamp or lastReadMessage
  lastReadAt: { type: Date, default: Date.now },
}, {
  methods : {
    isMemberInGroup(userId) {
      const out = this.isGlobal || this.members.some(m => m.user.equals(userId));
      return out;
    }
  },
  statics: {
    
  }
});

const UserChat = mongoose.model('ChatMembership', UserChatSchema);
export default UserChat;