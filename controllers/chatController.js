import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { matchedData } from "express-validator";
import mongoose from "mongoose";
import { CustomError, AuthorizationError, NotFoundError, TransactionError } from "../errors/errors.js";
import asyncHandler from 'express-async-handler';

export const getChatMessages = asyncHandler(async (req, res, next) => {
  const { chatId } = matchedData(req);

  const chat = await Chat.findById(chatId);
  if(!chat){
    throw new NotFoundError('Chat not found');
  }

  // Permissions
  // if not Admin, then check
  if(!req.user.isAdmin){
    const isMemberInGroup = chat.isMemberInGroup(req.user.id);
    if(!isMemberInGroup){
      throw new AuthorizationError('User does not belong to this group');
    }
  }

  // Otherwise, success
  // .find() returns an array. Automatically is empty array when no results
  const chatMessages = await Message.find({ chat: chatId }).sort({createdAt: -1});
  return res.json({ chat: chatMessages });
});

// TODO not sure if route below has any use, when we load a users chat, what we would do
// is grab the user, then look at their chats array, and load the chats whose isOpened is set to true
// so I think implment this logic in getChats, and comment this out, maybe we dont need this
// export const getChat = asyncHandler(async (req, res, next) => {
//   const { chatId } = matchedData(req);

//   const chat = await Chat.findById(chatId);
//   if(!chat){
//     throw new NotFoundError('Chat not found');
//   }

//   // Permissions
//   // if not Admin, then check
//   if(!req.user.isAdmin){
//     const isMemberInGroup = chat.isMemberInGroup(req.user.id);
//     if(!isMemberInGroup){
//       throw new AuthorizationError('User does not belong to this group');
//     }
//   }

//   // Otherwise, success
//   return res.json({ chat });
// });

// TODO new below, lots of questions, test this
// For example, does populate here only populate the ones that match, but still return the other chats unpopulated?
// Also if it only returns populated ones, is this even a good idea to program it like this, instead
// of letting the frontend just filter for isOpened?
// because then if the chat is closed, but we click on a friend, then ??? no nvm. We would still
// need to load all messages in this case, so there is no benefit to keeping the closed chats 'just in case'

// I think the whole point of this route, is the UI notification system
// It just shows you all the chats you have opened. Then when you click on one, it fetches for another
// rotue that returns all the messages from this chat
// TOOD TOOD ok now test how population works below, then proceed
export const getChats = asyncHandler(async (req, res, next) => {
  const user = await req.user.populate({
    path: 'chats.chat',
    match: { 'chats.isOpened': true }
  })

  if (!user.chats.length) {
    throw new NotFoundError('No opened chats found??');
  }

  const chats = user.chats;
  return req.json({chats});

});

export const createChat = asyncHandler(async (req, res, next) => {
  // TODO TODO, need some sort of separation or another route depending on if Im creating a
  // group chat or a dm chat. For example, I dont want to let people create duplciate chats,
  // so in the handler that handles only private DMs, I always want to first check if a
  // chat already exists with the 1 member passed in
  const { members, name, isGlobal } = matchedData(req);
  // can also do matchedData(req, { includeOptionals: true }) to include undefined fields,
  // but if we just destrucutre like above, I think we dont need this because we will get undefined anyways
  // its prob only good if we aren't destrucuring and just assigning as data = matchedData(req, { includeOptionals: true })
  const { user } = req;
  

  // Adds self user to members Set (unique), and checks that the total input ids is greater than 1
  const membersUnique = [...new Set([user.id, ...members])];
  if(membersUnique.length === 1){
    throw new CustomError('Cannot create a chat with just yourself');
  };

  // mandatoryAuth guarantees that validUsers will be at least 1
  // UNLESS user is deleted between this line and the previous check, so to be safe check <= 1
  const validUsers = await User.find({ _id: { $in: membersUnique } }).select('_id');
  if(validUsers.length <= 1){
    throw new CustomError('Cannot create a chat with just one member');
    // In the future maybe allow this (creating a chat with just yourself as only valid user)
  }

  // At this point, 2 or more valid users (including self) (unless one user is deleted between this line and prev?)
  // I think it makes sense to have the split here between group, global, and private chats
  let chat;
  if(validUsers.length > 2){
    chat = await createGroupChat({ members: membersUnique, name, isGlobal });
  }else{
    chat = await createPrivateChat({members: membersUnique})
  }
  return res.json({ chat });
});

// member will come in as [123, 2342, 35], but now Schema has the form
// [{user, total_unread}], so adjusting schema input below
const createGroupChat = async ({members, name, isGlobal}) => {
  const newChat = new Chat({
    name,
    members: members.map(m => ({user: m})),
    //
    isGroupChat: true,
    isGlobal
    // I plan to change this in the schema. To instead have 1 field type of enum string
    // that can either be 'global', 'private', or 'group'
    // so the 2 assingments above here would change
  });

  const chat = await newChat.save();
  return chat;
};

const createPrivateChat = async ({membersIn}) => {
  const newChat = new Chat({
    members: membersIn.map(m => ({user: m})),
  });

  const chat = await newChat.save();
  return chat;
};

//
// TODO manual test createChat and getChats above
// TODO check/read all fns below this line

export const addUserToChat = asyncHandler(async (req, res, next) => {
  const {userId, chatId} = matchedData(req);

  const chat = await Chat.findById(chatId);
  if(!chat){
    throw new NotFoundError('Chat not found');
  }

  // Permissions:
  // maybe let admins to anything??
  if(!chat.isMemberInGroup(req.user.id)){
    throw new AuthorizationError('User requesting this add operation is not part of this chat');
  }

  if(chat.isMemberInGroup(userId)){
    throw new CustomError('Target User is already in this Chat', {statusCode: 409});
  }
  // Target user is not in chat, see if they exist at all
  const user = await User.findById(userId);
  if(!user){
    throw new NotFoundError('Target User doesnt exist');
  }

  // Transaction
  user.chats.push({ id: chatId })
  chat.members.push({ user: userId });
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
  

export const removeUserFromChat = asyncHandler(async (req, res, next) => {
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
    throw new TransactionError(message);
    // TODO test above. The correct flow should be:
    // catches error, then throws Custom error, then before propagating out of this fn,
    // it runs the finally block, and then it propagates
  } finally {
    console.log('finally');
    session.endSession();
  }
})