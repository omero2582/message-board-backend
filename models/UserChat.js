import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserChatSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
  // totalUnread: { type: Number, default: 0 }, // doesnt scale beacuse anytime a chat has a new msg,
  // I'd have to query all the documents here from that chat, and add 1 to each document
  // better to have something 'client orgininated'. Like lastReadTimestamp or lastReadMessage
  status: { type: String, enum: ['banned', 'active', 'muted'], default: 'active' },
  isOpened: { type: Boolean, default: true },
  lastReadMessage: { type: Schema.Types.ObjectId, ref: 'Message' }, // get the last read date from this
  //
  role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
  permissions: {
    canAddUsers: { type: Boolean, default: false },
    canRemoveUsers: { type: Boolean, default: false },
    canChangeSettings: { type: Boolean, default: false },
  },
  // permissions: { 
  //   type: [String],
  //   enum: ['canAddUsers', 'canRemoveUsers', 'canChangeSettings'],
  //   default: [],
  // },
}, {
  methods : {
    hasPowersEqualOrMoreThan(userChat) {
      const roleRanks = {
        owner: 3,
        admin: 2,
        member: 1
      };
  
      return roleRanks[this.role] >= roleRanks[userChat.role];
    }
  },
  statics: {
    
  }
});

const UserChat = mongoose.model('UserChat', UserChatSchema);
export default UserChat;