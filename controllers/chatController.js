import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { matchedData } from "express-validator";
import { runTransaction } from "../config/database.js";
import mongoose from "mongoose";

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
  const chatMessages = await Message.find({ chat: chatId }).sort({createdAt: -1});
  return res.json({ chat: chatMessages });
}

export async function getChat(req, res, next) {
  const { chatId } = matchedData(req);

  const chat = await Chat.findById(chatId);
  if(!chat){
    return res.status(404).json({error: 'Chat not found'});

    const err = new Error('Chat not found');
    err.status = 404;
    throw err;

    throw new CustomError('Chat not found', {status: 404});
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

//
//
export async function addUserToChat(userId, chatId) {
// export async function addUserToChat(req, res, next) {
  // const {userId, chatId} = matchedData(req);
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
  
  // Transaction
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
        await chat.save({ session });
        await user.save({ session });
    });
  } catch (error) {
    const {message, errors, stack} = error;
    console.error('ABORTING TRANSACTION', message);
  } finally {
    session.endSession();
  }
}
  // Can maybe make a helper for above, similar to our runTransaction helper,
  // But I want each transaction to handle each error differently so they can send a response...
  // So if we WERE to make a helper, we'd need the helper to rethrow the error
  // This means the only code we'd be saving by writing with helper, is the 'session.endSession();'
  // So I don't think It makes sense to make a helper

  // Transaction alternatives (all worse than my approach above)
  // Approach 1 (my runTransaction runs a lot of extra boilerplate, and also handles all errors the same)
  //const session = await mongoose.startSession();
  // await runTransaction(session, async() => {
  //   await chat.save({session});
  //   await user.save({session});
  // })

  // Approach 2 (Very simple, but no control over logging nor catching & dealing with the error itself)
  // mongoose.connection.transaction(async (session) => {
  //   await chat.save({session});
  //   await user.save({session});
  // })
  

//TODO
export async function removeUserFromChat(userId, chatId) {
// export async function removeUserFromChat(req, res, next) {
//   const {userId, chatId} = matchedData(req);  
  // await runTransaction(async() => {
  //   await Chat.findByIdAndUpdate(chatId, { 
  //     $pull: { members: { user: userId } } 
  //   });
  //   await User.findByIdAndUpdate(userId, { 
  //     $pull: { chats: { ids: chatId } }
  //    });
  // })

  // Transaction
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await Chat.findByIdAndUpdate(chatId, { 
        $pull: { members: { user: userId } } 
      });
      await User.findByIdAndUpdate(userId, { 
        $pull: { chats: { id: chatId } }
       });
    });
  } catch (error) {
    const {message, errors, stack} = error;
    console.error('ABORTING TRANSACTION', message);
  } finally {
    session.endSession();
  }
}