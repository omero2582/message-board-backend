import mongoose from "mongoose";
import User from "./User.js";

const Schema = mongoose.Schema;

const ChatSchema = new Schema({
  name: { type: String },
  members: [{ 
    _id: false,
    user: { type: Schema.Types.ObjectId, ref: 'User'},
    totalUnread: { type: Number, default: 0 },
    // nice to have 'totalUnread'here, so that when a user sends a new message,
    // I can easily add 1 to the total unread of every member
  }],
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
    async addUserToChat(userId, chatId) {
      const chat = await Chat.findById(chatId);
      if(chat.isMemberInGroup(userId)){
        throw new Error('user already in this Chat');
      }
      // user not in chat
      const user = await User.findById(userId);
      if(!user){
        throw new Error('user doesnt exist')
      }
      user.chats.push({ id: chatId })
      chat.members.push({ user: userId });
      await runTransaction(async() => {
        await chat.save();
        await user.save();
      })
        // await Chat.findByIdAndUpdate(chatId, {  
        //   $addToSet: { members: { user: userId } } 
        // });
        // await User.findByIdAndUpdate(userId, {  
        //   $addToSet: { chats: { id: chatId } } 
        // });
    },
    async removeUserFromChat(userId, chatId) {
      await runTransaction(async() => {
        await Chat.findByIdAndUpdate(chatId, { 
          $pull: { members: { user: userId } } 
        });
        await User.findByIdAndUpdate(userId, { 
          $pull: { chats: { ids: chatId } }
         });
      })
    }
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

async function runTransaction(transactionCallback) {
  let session;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  
    await transactionCallback();

    await session.commitTransaction();
    
  } catch (error) {
    // Abort the transaction
    await session.abortTransaction();
  } finally {
    await session.endSession();
  }
}
//  https://www.mongodb.com/docs/drivers/node/current/fundamentals/transactions/
//  https://mongoosejs.com/docs/transactions.html

const Chat = mongoose.model('Chat', ChatSchema);
export default Chat;