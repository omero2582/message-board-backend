import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import { matchedData } from "express-validator";

export async function getChatMessages(req, res, next) {
  const { chatId } = matchedData(req);

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
  const chatMessages = await Message.find({ chat: chatId}).sort({createdAt: -1});
  return res.json({ chatMessages });
}

export async function getChat(req, res, next) {
  const { chatId } = matchedData(req);

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

export async function createMessage(req, res, next){
  const { content, chatId } = matchedData(req);

  const newMesasge = new Message({
   sender: req.user.id,
   content,
   chat: chatId,
  });
  // Schema custom middelware checks here if chat exists, and if user has permissions for this
  // (if user is in chat)
  
  const message = await newMesasge.save();
  return res.json({message});
}

export async function deleteMesssage(req, res, next) {
  const { messageId } = matchedData(req);

  const message = await Message.findById(messageId).populate({
    path: 'chat',
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

    const isSender = req.user.id === message.sender.toString();
    if(!isSender){
      return res.status(401).json({error: 'User is not the sender of this message'})
    }
  }

  // Otherwise, success
  const deleted_message = await message.deleteOne();
  return res.json({deleted_message})
  // TODO, ^^^ this returns the following:
  // {
  //   "deleted_message": {
  //       "acknowledged": true,
  //       "deletedCount": 1
  //   }
  // }
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
