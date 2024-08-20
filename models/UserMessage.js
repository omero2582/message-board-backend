import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserMessageSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: Schema.Types.ObjectId, ref: 'Message', required: true},
  readAt: { type: Date }
}, {
  timestamps: false,
  methods : {

  },
  statics: {
    
  },
});

const UserMessage = mongoose.model('UserMessage', UserMessageSchema);
export default UserMessage;