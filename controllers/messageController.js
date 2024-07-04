import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

export async function createChat(req, res, next) {
  const { name, members, isGroupChat, isGlobal } = matchedData(req);

  const newChat = new Chat({
    name,
    members,
    isGroupChat,
    isGlobal
  });

  const chat = await newChat.save();
  return res.json({ chat });
}

export async function getChatMessages(req, res, next) {
  const chatId = req.params.chatId;

  const chat = await Chat.findById(chatId);

  if(!chat){
    return res.status(404).json({error: 'Chat not found'})
  }

  // Permissions
  // if not Admin, then check
  if(!req.user.isAdmin){
    console.log('test');
    const isMemberInGroup = chat.isMemberInGroup(req.user.id);
    console.log('test2');
    if(!isMemberInGroup){
      return res.status(401).json({error: 'User does not belong to this group'})
    }
  }

  // Otherwise, success
  console.log('test3');
  const chatMessages = await Message.find({ chat: chatId});
  console.log('test4');
  return res.json({ chatMessages });
}

// TODO change this to get chat messages, or create new handler
export async function getChat(req, res, next) {
  const chatId = req.params.chatId;

  const chat = await Chat.findById(chatId);

  if(!chat){
    return res.status(404).json({error: 'Chat not found'})
  }

  // Permissions
  // if not Admin, then check
  if(!req.user.isAdmin){
    const isMemberInGroup = chat.isMemberInGroup(req.user.id);
    if(!isMemberInGroup){
      return res.status(401).json({error: 'User does not belong to this group'})
    }
  }

  // Otherwise, success
  return res.json({ chat });
}

export async function deleteMesssage(req, res, next) {
  const messageId = req.params.messageId;

  const message = await Message.findById(messageId).populate({
    path: 'group',
    populate: {
      path: 'members',
      model: 'User'
    }
  });
  if(!message){
    return res.status(404).json({error: 'Message not found'})
  }

  // Permissions
  // if not Admin, then check
  if(!req.user.isAdmin){
    const isMemberInGroup = message.chat.isMemberInGroup(req.user.id);
    if(!isMemberInGroup){
      return res.status(401).json({error: 'User does not belong to this group'})
    }

    const isSender = req.user.id === message.sender;
    if(!isSender){
      return res.status(401).json({error: 'User is not the sender of this message'})
    }
  }

  // Otherwise, success
  const deleted_message = await message.deleteOne();
  return res.json({deleted_message})
}

export async function createMessage(req, res, next){
  const { content, chat } = matchedData(req);
  
  const newMesasge = new Message({
   sender: req.user.id,
   content,
   chat,
  });
  // Schema custom middelware checks here if chat exists, and if user has permissions for this
  // (if user is in chat)
  
  const message = await newMesasge.save();
  return res.json({message});
}

  
// TODO TOOD NEW FINALL no longer using block commented out below
// Not sure if we should check if ALL recipients exist, or if at least 1 exists, or if we care at all
// maybe if any exists for now
// try {
//   const recipientsFound = await User.find({
//     _id: { $in: recipients }
//   });
// } catch (error) {
//   return res.status(404).json({error: 'recipients not found'})
// }
// Check above, using errors to catch if ANY recipient fails. check if this acutally works
