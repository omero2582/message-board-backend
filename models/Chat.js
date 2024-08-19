import mongoose from "mongoose";

const Schema = mongoose.Schema;

const ChatSchema = new Schema({
  name: { type: String },
  type: { type: String, enum: ['direct', 'group', 'self'], required: true },
  // can maybe add 'global' or 'livestream' in the future. But 99.9% no, because I'd be better
  // to use a dedicated table for livestream chats. For 'global'... not sure
}, {
  methods : {
  },
  statics: {
    
  }
});

const Chat = mongoose.model('Chat', ChatSchema);
export default Chat;