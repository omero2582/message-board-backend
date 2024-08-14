import mongoose from "mongoose";

const Schema = mongoose.Schema;

const ChatSchema = new Schema({
  name: { type: String },
  members: {
    type :  [{ 
      _id: false,
      user: { type: Schema.Types.ObjectId, ref: 'User'},
      totalUnread: { type: Number, default: 0 },
      // nice to have 'totalUnread'here, so that when a user sends a new message,
      // I can easily add 1 to the total unread of every member
    }],
    required: true,
  },
  type: { type: String, enum: ['private', 'group'], required: true },
  // isGroupChat: { type: Boolean, default: false }
  // isGlobal: { type: Boolean, default: false },
  // Think of GlobalChats like a livestream chat.
  // Removed 'Global Chats' because we need to set a limit on chats, due to our architecture with
  // unbounded array here. If we wanted global chats, then 'readBy' on MessageSchema would have to be
  // extracted into a separate UserMessage table, and 'totalUnread' on ChatSchema would have to be
  // extracted into a separate UserChat table 
}, {
  methods : {
    isMemberInGroup(userId) {
      // const out = this.isGlobal || this.members.some(m => m.user.equals(userId));
      const out = this.members.some(m => m.user.equals(userId));
      return out;
    }
  },
  statics: {
    
  }
});

// ChatSchema.pre('validate', async function (next) {
//   console.log('Chat validation middleware');
//   // TODO check if this runs the doing 'new Chat', or if it runs
//   // when doing save(). I think it runs when doing save(), and that 
//   // the point of it is giving you a chance to do something on 'save' middleware
//   // accounting that the data is valid after validate middleware has run
//   if(this.isGlobal){
//     this.isGroupChat = true;
//   }
//   next();
// });
// above was when isGlobal was a thing

// ChatSchema.methods.isMemberInGroup = function (userId) {
//   return this.isGlobal || this.members.some(m => m.user.id === userId);
// };


const Chat = mongoose.model('Chat', ChatSchema);
export default Chat;