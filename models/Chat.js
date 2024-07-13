import mongoose from "mongoose";
import User from "./User.js";

const Schema = mongoose.Schema;

const ChatSchema = new Schema({
  name: { type: String },
  members: [{ 
    _id: false,
    user: { type: Schema.Types.ObjectId, ref: 'User'},
    totalUnread: { type: Number, default: 0 },
  }],
  isGlobal: { type: Boolean, default: false },
  isGroupChat: { type: Boolean, default: false }
}, {
  methods : {
    isMemberInGroup(userId) {
      return this.isGlobal || this.members.some(m => m.user.id === userId);
    }
  },
  statics: {
    // TODO gonna change these static methods to be outside in a
    // controllet function. The initial reason these are static methods
    // instead of instance methods
    // is because Chat.findByIdAndUpdate would be ran without a reference
    // to any instance. However the problem I now have, is that
    // I realize $addToSet, which adds only if object doesnt already exist,
    // does not allow for us to check any custom conditions, it will
    // instead always check if the entire object inputted already exists.
    // So our code below doesnt work (tested already), because
    // It detects 'hey is there any user object in the members array
    // that is exatcly {id: 123} ? ' And this will skip over
    // {id: 123, totalUnread: 2}

    // Overall, I think I no longer want to leave these functions as
    // neither static nor instance methods, because depending on any
    // slight customization we want to make to our logic, these functions
    // can change between needing to be ran as static and instance
    async addUserToChat(userId, chatId) {
      await runTransaction(async() => {
        await Chat.findByIdAndUpdate(chatId, {  
          $addToSet: { members: { user: userId } } 
        });
        await User.findByIdAndUpdate(userId, {  
          $addToSet: { chats: { ids: chatId } } 
        });
      })
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

// TODO add another chat rule....
// if member is already in the array, then dont add them and maybe
// send error...