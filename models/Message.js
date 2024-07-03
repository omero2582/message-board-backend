import mongoose from "mongoose";
import User from "./User";
import Group from "./Group";

const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  recipients: [{ type: Schema.Types.ObjectId, ref: 'User'}],
  group: { type: Schema.Types.ObjectId, ref: 'Group' },
}, {
  timestamps: true,
  validate: {
    validator: function () {
      // Check that either recipients or group is provided, but not both
      const hasRecipients = this.recipients && this.recipients.length > 0;
      const hasGroup = this.group != null;
      return (hasRecipients || hasGroup) && !(hasRecipients && hasGroup);
    },
    message: 'Either recipients or group must be provided, but not both.'
  }
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


MessageSchema.post('validate', async function (next) {
  const groupFound = await Group.findById(group);
  if(!groupFound){
    const err = new Error('Group not Found');
    err.status = 404;
    return next(err);
  }
  next();
});

const Message = mongoose.model('Message', MessageSchema);
export default Message;