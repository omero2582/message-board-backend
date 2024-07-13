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
  // member will come in as [123, 2342, 35], but now Schema has the form
  // [{user, total_unread}], so adjusting schema input below
  const membersIn = members.map(m => {
    return {
      user: m,
    }
  })

  const newChat = new Chat({
    name,
    members: membersIn,
    isGroupChat,
    isGlobal
  });

  const chat = await newChat.save();
  return res.json({ chat });
}