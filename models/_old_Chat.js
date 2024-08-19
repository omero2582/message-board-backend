import mongoose from "mongoose";
import User from "./User.js";

  // const user = await req.user.populate({
  //   path: 'chats.chat',
  //   match: { 'chats.isOpened': true }
  // })

const Schema = mongoose.Schema;

const ChatSchema = new Schema({
  name: { type: String },
  // TODO add default name, maybe a validation middleware based on the type of chat?
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
  isGlobal: { type: Boolean, default: false },
  isGroupChat: { type: Boolean, default: false }
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

ChatSchema.pre('validate', async function (next) {
  console.log('Chat validation middleware');
  // TODO check if this runs the doing 'new Chat', or if it runs
  // when doing save(). I think it runs when doing save(), and that 
  // the point of it is giving you a chance to do something on 'save' middleware
  // accounting that the data is valid after validate middleware has run
  if(this.isGlobal){
    this.isGroupChat = true;
  }
  next();
});

// ChatSchema.methods.isMemberInGroup = function (userId) {
//   return this.isGlobal || this.members.some(m => m.user.id === userId);
// };


const Chat = mongoose.model('Chat', ChatSchema);
export default Chat;