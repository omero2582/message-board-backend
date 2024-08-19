import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { matchedData } from "express-validator";
import mongoose from "mongoose";
import { CustomError, AuthorizationError, NotFoundError, TransactionError, ValidationError } from "../errors/errors.js";
import asyncHandler from 'express-async-handler';
import UserChat from "../models/UserChat.js";

// This route is the UI chat sidebar/preview, It shows you all the chats you have opened
export const getChats = asyncHandler(async (req, res, next) => {
  const openedChats = await UserChat.find({user: req.user.id, isOpened: true}).populate('chat');
  
  if (!openedChats.length) {
    throw new NotFoundError('No opened chats found');
  }
  
  return res.json({chats: openedChats});
});
// Works, properly retrieves chats that are Opened


// When you click on one chat, this route will return all the messages from that chat
export const getChatMessages = asyncHandler(async (req, res, next) => {
  const { chatId } = matchedData(req);

  const chat = await Chat.findById(chatId);
  if(!chat){
    throw new NotFoundError('Chat not found');
  }

  // Permissions
  if(!req.user.isAdmin){
    const isMemberInGroup = await UserChat.findOne({chat: chatId, user: req.user.id});
    if(!isMemberInGroup){
      throw new AuthorizationError('User does not belong to this group');
    }
  }

  // Otherwise, success
  const chatMessages = await Message.find({ chat: chatId }).sort({createdAt: -1});
  return res.json({ chat: chatMessages });
});
// TODO, probably create a route that when you click on a friend in your friends list (not the chat sidebar),
// will return your existing chat with them and load all of those chatMessages


export const createChat = asyncHandler(async (req, res, next) => {
  // data = matchedData(req, { includeOptionals: true })  // not needed bc we are destructuring
  const { members, name, type } = matchedData(req);
  const { user } = req;
  

  // Checks if total # of unique input users is greater than 1
  const membersUnique = [...new Set([user.id, ...members])];
  if(membersUnique.length === 1){
    throw new ValidationError('Cannot create a chat with just yourself');
  };

  // mandatoryAuth guarantees that validUsers will be at least 1
  // UNLESS user is deleted between this line and the previous check, so to be safe check <= 1
  // In the future allow creating a chat with just yourself as only valid user
  const validUsers = await User.find({ _id: { $in: membersUnique } }).select('_id');
  if(validUsers.length <= 1){
    throw new ValidationError('Cannot create a chat with only 1 or less valid members');
  }

  // At this point, 2 or more valid users (including self) (unless one user is deleted between this line and prev?)
  let chat;
  if(type === 'direct'){
    if(validUsers.length !== 2){
      throw new ValidationError('Can only create a direct chat with 2 valid members')
    }
    chat = await createDirectChat({members: validUsers, type: "direct" })
  }else{
    chat = await createGroupChat({ members: validUsers, name, type: "group" });
  }
  return res.json({ chat });
});

// TODO TODO both this function and createDirectChat are almost the same, the
// only real difference ins that createDirectChat does an extra check at the start of the try/catch
// we can prob condesnse these functions into a reusable one, but just test if code works for now
// TODO TODO, for both functions, giver owner role to the user creating the chat
const createGroupChat = async ({members, name, type}) => {
  const chat = new Chat({ name, type });
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await chat.save({session});
      const membersDocuments = members.map(m => new UserChat({
        chat,
        user: m,
      }))
      await UserChat.insertMany(membersDocuments, {session});
    });
    return chat;  // maybe return members too ?
  } catch (error) {
    const {message, errors, stack} = error;
    throw new TransactionError(message);
  } finally {
    session.endSession();
  }
};

const createDirectChat = async ({members, name, type}) => {
  const session = await mongoose.startSession();
  try {
    // Check if a chat with these members already exists
    const existingChat = await UserChat.aggregate([
      { $match: { user: { $in: members.map(m => m._id) } } },
      { $group: { _id: "$chat", count: { $sum: 1 } } },
      { $match: { count: 2 } }, // Ensure both members are present
      { $lookup: { from: 'chats', localField: '_id', foreignField: '_id', as: 'chatDetails' } },
      { $unwind: "$chatDetails" },
      { $match: { "chatDetails.type": "direct" } } // Ensure it is a direct chat
    ]).session(session);
    // TODO TODO TODO, figure out if we even need to include this aggregation in the session
    // I feel like we dont need to at all since we aren't writing anything in this arggregation
    // This is also outside of our 'withTransaction' below, so I really dont know what including
    // it in a session does, or including it in this trycatch. This and the if check below
    // could instead maybe just be at the very top of this function

    // If an existing DM chat is found, return it
    if (existingChat.length > 0) {
      console.log('DM already exists');
      return existingChat[0].chatDetails;
    }

    // Otherwise Create a new chat
    const chat = new Chat({ name, type });
    await session.withTransaction(async () => {
      await chat.save({session});
      const membersDocuments = members.map(m => new UserChat({
        chat,
        user: m,
      }))
      await UserChat.insertMany(membersDocuments, {session});
    });
    return chat;  // maybe return members too ?
  } catch (error) {
    const {message, errors, stack} = error;
    throw new TransactionError(message);
  } finally {
    session.endSession();
  }
};

//
// TODO check/read all fns below this line
// user permissions rotes

export const addUserToChat = asyncHandler(async (req, res, next) => {
  const {userId, chatId} = matchedData(req);

  const chat = await Chat.findById(chatId);
  if(!chat){
    throw new NotFoundError('Chat not found');
  }
  if(chat.type === "direct"){
    throw new CustomError('Cannot add user to Direct Chats')
  }

  // Check if target user exists at all
  const user = await User.findById(userId);
  if(!user){
    throw new NotFoundError('Target User doesnt exist');
  }

  // Permissions
  const selfAndTargetInGroup = await UserChat.find({chat: chatId, user: { $in: [req.user.id, userId] }});
  const isSelfInGroup = selfAndTargetInGroup.find(u => u.id === req.user.id);
  if(!isSelfInGroup){
    throw new AuthorizationError('User requesting this add operation is not part of this chat');
  }

  const isTargetInGroup = selfAndTargetInGroup.find(u => u.id === userId);
  if(isTargetInGroup){
    throw new CustomError('Target User is already in this Chat', {statusCode: 409});
  }

  // Otherwise, success
  const membersDocuments = [userId, req.user.id].map(m => new UserChat({
    chat,
    user: m,
  }))
  const out = await UserChat.insertMany(membersDocuments);
  return res.json({ out });
});

// Route will be DELETE /chats/:chatId/members
// Regular Members cant remove unless they have canRemove permission. Owner can remove anyone. Admins can remove anyone EXCEPT owners
export const removeUsersFromChat = asyncHandler(async (req, res, next) => {
  const {users, chatId} = matchedData(req);

  const chat = await Chat.findById(chatId);
  if(!chat){
    throw new NotFoundError('Chat not found');
  }
  if(chat.type === "direct"){
    throw new CustomError('Cannot remove users from Direct Chats')
  }

  // Permissions
  const userChat = await UserChat.find({ id: { $in: [...users, req.user._id] }, chat: chatId});
  const userChatsMe = userChat.find(u => u.user.equals(req.user._id));
  if (!userChatsMe) {
    throw new AuthorizationError('You are not a part of this chat');
  }

  if(userChatsMe.role === 'member' && !userChatsMe.permissions.canRemoveUsers){
    throw AuthorizationError('Need to be Admin or have Remove Permissions to remove users');
  }
  
  const userChatTargets = userChat.filter(u => u.user.equals(req.user._id));
  // maybe change below to filters and remove if statement, but idk if its worth performance loss
  // const haveEqualOrMorePowersThan = userChatTargets.filter(u => userChatsMe.hasPowersEqualOrMoreThan(u));
  // const haveLessPowersThan = userChatTargets.filter(u => !userChatsMe.hasPowersEqualOrMoreThan(u));
  let haveLessPowersThan = [];
  let haveEqualOrMorePowersThan = [];
  if(userChatsMe.role === 'owner'){
    haveEqualOrMorePowersThan = userChatTargets;
  } else {  // admin, or member with 'canRemoveUsers' permission
    for (const targetUser of userChatTargets) {
      if(userChatsMe.hasPowersEqualOrMoreThan(targetUser)) {
        haveEqualOrMorePowersThan.push(targetUser);
      } else {
        haveLessPowersThan.push(targetUser);
      }
    }
  }

  if(haveEqualOrMorePowersThan.length === 0){
    throw new AuthorizationError('No members inputted with equal or less power that can be removed');
  }

  const out = await UserChat.deleteMany({ chat: chatId, user: { $in: haveEqualOrMorePowersThan } });
  return res.json({out, usersWithMorePower: haveLessPowersThan})
})

// Todo create another route DELETE /chats/:chatId/members/me
// Nobody can remove a group owner other than himself
// If owner removes himself, then send error, tell them they cant be an owner.
// also for /deleteChat, only owner can delete

// Transaction Approach 2 (Very simple, but no control over logging nor catching & dealing with the error itself)
// mongoose.connection.transaction(async (session) => {
//   await chat.save({session});
//   await user.save({session});
// })