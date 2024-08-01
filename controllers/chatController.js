import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { matchedData } from "express-validator";
import mongoose from "mongoose";
import { CustomError } from "../errors/errors.js";
import asyncHandler from 'express-async-handler';

export const getChatMessages = asyncHandler(async (req, res) => {
  const { chatId } = matchedData(req);

  const chat = await Chat.findById(chatId);
  if(!chat){
    throw new CustomError('Chat not found', {statusCode: 404});
  }

  // Permissions
  // if not Admin, then check
  if(!req.user.isAdmin){
    const isMemberInGroup = chat.isMemberInGroup(req.user.id);
    if(!isMemberInGroup){
      throw new CustomError('User does not belong to this group', {statusCode: 401});
    }
  }

  // Otherwise, success
  const chatMessages = await Message.find({ chat: chatId }).sort({createdAt: -1});
  return res.json({ chat: chatMessages });
});

export const getChat = asyncHandler(async (req, res) => {
  const { chatId } = matchedData(req);

  const chat = await Chat.findById(chatId);
  if(!chat){
    throw new CustomError('Chat not found', {statusCode: 404});
  }

  // Permissions
  // if not Admin, then check
  if(!req.user.isAdmin){
    const isMemberInGroup = chat.isMemberInGroup(req.user.id);
    if(!isMemberInGroup){
      throw new CustomError('User does not belong to this group', {statusCode: 401});
    }
  }

  // Otherwise, success
  return res.json({ chat });
});

export const createChat = asyncHandler(async (req, res) => {
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
});

//
//
// TODO I'm currently swapping back and forth the commented 1-2 lines below for testing. Switch to express testing library
// export async function addUserToChat(userId, chatId) {
export const addUserToChat = asyncHandler(async (req, res) => {
  const {userId, chatId} = matchedData(req);
  const chat = await Chat.findById(chatId);

  // any permissions for this???

  if(chat.isMemberInGroup(userId)){
    throw new CustomError('User is already in this Chat', {statusCode: 409});
  }
  // user not in chat
  const user = await User.findById(userId);
  if(!user){
    throw new CustomError('User doesnt exist', {statusCode: 404});
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
});
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
// export async function removeUserFromChat(userId, chatId) {
export const removeUserFromChat = asyncHandler(async (req, res) => {
  const {userId, chatId} = matchedData(req);  
  // await runTransaction(async() => {
  //   await Chat.findByIdAndUpdate(chatId, { 
  //     $pull: { members: { user: userId } } 
  //   });
  //   await User.findByIdAndUpdate(userId, { 
  //     $pull: { chats: { ids: chatId } }
  //    });
  // })

  // Permissions???

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
    console.error('ABORTING TRANSACTION', 'Error Finding and Removing Chat or User in Transaction');
    throw new CustomError(message, {
      name: 'TransactionError',
      statusCode: 500
    });
    // TODO test above. The correct flow should be:
    // catches error, then throws Custom error, then before propagating out of this fn,
    // it runs the finally block, and then it propagates
  } finally {
    console.log('finally');
    session.endSession();
  }
})