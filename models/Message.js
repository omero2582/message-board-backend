import mongoose from "mongoose";
import Chat from "./Chat.js";

const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  content: { type: String, required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
  // recipients: [{ type: Schema.Types.ObjectId, ref: 'User'}],
}, {
  timestamps: true,
  // validate: {
  //   validator: function () {
  //     // Check that either recipients or group is provided, but not both
  //     const hasRecipients = this.recipients && this.recipients.length > 0;
  //     const hasGroup = this.group != null;
  //     return (hasRecipients || hasGroup) && !(hasRecipients && hasGroup);
  //   },
  //   message: 'Either recipients or group must be provided, but not both.'
  // }
})

// MessageSchema.path('recipients').validate(function (value) {
//   // Either recipients or group must be present
//   return value.length > 0 || this.group != null;
// }, 'Message must have either recipients or a group');

// MessageSchema.path('group').validate(function (value) {
//   // Either recipients or group must be present
//   return value != null || this.recipients.length > 0;
// }, 'Message must have either recipients or a group');

// MessageSchema.post('validate', async function (next) {
//   const userExists = await User.exists({ _id: this.author });

//   if (!userExists) {
//     return next(new Error('Referenced user does not exist'));
//   }

//   next();
// });

// MessageSchema.post('validate', async function (doc, next) {
MessageSchema.pre('save', async function (next) {
  // Does chat exist
  const chatFound = await Chat.findById(this.chat);
  if(!chatFound){
    const err = new Error('Chat not Found');
    err.status = 404;
    return next(err);
  }

  // Are they a member of this chat or is the chat global
  if (!chatFound.isGlobal){
    const isSenderInChat = chatFound.members.some(m => m.id === this.sender.id);
    if(!isSenderInChat){
      const err = new Error('User is not a Member of this Chat');
      err.status = 403;
      return next(err);
    }
  }

  next();
});

// MessageSchema.pre('deleteOne', async function (next){
//   const chatFound = await Chat.findById(this.chat);
//   const isSenderInChat = chatFound.members.some(m => m.id === this.sender.id);
//   if(!isSenderInChat){
//     const err = new Error('User is not a Member of this Chat');
//     err.status = 403;
//     return next(err);
//   }

//   next();
// })
// this needs to be incontroller function, because for example, and admin (not sender)
// might want to delete a mesage

const Message = mongoose.model('Message', MessageSchema);
export default Message;