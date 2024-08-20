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

// TODO TODO.... need this whole function to use a transaction and need to re-fetch req.user
// why? beacuse otherwise I canrun into race condition where I checked ffor existing users,
// then a user is deleted via another reuqest, and then the rest of my intial request runs and creates the chat with non-esistant users
export const createChat = asyncHandler(async (req, res, next) => {
  // data = matchedData(req, { includeOptionals: true })  // not needed bc we are destructuring
  const { members, name, type } = matchedData(req);
  // Checks if total # of unique input members is greater than 1
  // const membersExcludingMe = members.filter(m => !req.user.equals(m));
  // if(membersExcludingMe.length === 0){
  //   throw new ValidationError('Cannot create a chat with just yourself');
  // };
  // we could do this, but the only purpose of this was to save the next users fetch call,
  // in the scenario that a malicious user input themselves as the only member
  // But I would rather not run that extra .filter on every request and save performance

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const validMembers = await User.find({ _id: { $in: [req.user,...members] }})
      .session(session)
      .select('_id');
      
      const me = validMembers.find(m => req.user.equals(m));
      if(!me){
        throw new NotFoundError('User making this request was not found');
      }

      let chat;
      if(type === 'direct'){
        if(validMembers.length !== 2){
          throw new ValidationError('Can only create a direct chat with 2 users') 
          // TODO when using validation error, make sure they have same format as form validations for ex on/sign-up
        }
        chat = await createDirectChat({ session, members: validMembers })

      }else{
        // In the future maybe allow creating a group chat with just yourself as only valid user
        const validMembersExcludingMe = members.filter(m => !req.user.equals(m));
        if(validMembersExcludingMe.length < 1){
          throw new NotFoundError('No valid members found');
        }
        chat = await createGroupChat({ session, members: validMembersExcludingMe, name, user:me });
      }
      return res.json({ chat });
    });
  } catch (error) {
    const {message, errors, stack} = error;
    if(error instanceof CustomError){
      throw error;
    }
    throw new TransactionError(message);
  } finally {
    session.endSession();
  }
});

// TODO set the chat.lastMessage after sending a message
const createGroupChat = async ({members, name, user, session}) => {
  const chat = new Chat({ name, type: 'group' });
  await chat.save({session});
  const membersDocuments = members.map(m => new UserChat({ chat, user: m }));
  const allDocuments = [...membersDocuments, new UserChat({ chat, user, role: "owner" })];
  await UserChat.insertMany(allDocuments, {session});
  
  return chat;  // maybe return members too ?
};

const createDirectChat = async ({members, name, session}) => {
  const existingDirectChat = await UserChat.aggregate([
    { $match: { user: { $in: members.map(m => m._id) } } },
    { $group: { _id: "$chat", count: { $sum: 1 } } },
    { $match: { count: 2 } }, // Ensure both members are present
    { $lookup: { from: 'chats', localField: '_id', foreignField: '_id', as: 'chatDetails' } },
    { $unwind: "$chatDetails" },
    { $match: { "chatDetails.type": "direct" } } // Ensure it is a direct chat
  ]).session(session);
  
  // If an existing DM chat is found, return it
  if (existingDirectChat.length > 0) {
    console.log('DM already exists');
    return existingDirectChat[0].chatDetails;
  }
  
  // Otherwise Create a new chat
  const chat = new Chat({ name, type: 'direct' });
  await chat.save({session});
  const membersDocuments = members.map(m => new UserChat({ chat, user: m }))
  await UserChat.insertMany(membersDocuments, {session});

  return chat;  // maybe return members too ?
};

//
// TODO check/read all fns below this line
// user permissions rotes
// Any regular member can add anyone to a chat
export const addUserToGroupChat = asyncHandler(async (req, res, next) => {
  // TODO maybe change this to addUsers (plural)
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
  const meAndTargetUserChats = await UserChat.find({chat: chatId, user: { $in: [req.user.id, userId] }});
  const meUserChat = meAndTargetUserChats.find(u => u.id === req.user.id);
  if(!meUserChat){
    throw new AuthorizationError('User requesting this add operation is not part of this chat');
  }

  // not using add permissions. We let anybody add anyone to a chat
  // if(meUserChat.role === 'member' && !meUserChat.permissions.canAddUsers){
  //   throw AuthorizationError('Need to be Admin or have Add Permissions to add users');
  // }

  const targetUserChat = meAndTargetUserChats.find(u => u.id === userId);
  if(targetUserChat){
    throw new CustomError('Target User is already in this Chat', {statusCode: 409});
  }

  // Otherwise, success
  const membersDocuments = [userId, req.user.id].map(m => new UserChat({ chat, user: m}))
  const out = await UserChat.insertMany(membersDocuments);
  return res.json({ out });
});

// Route will be DELETE /chats/:chatId/members
// Regular Members cant remove unless they have canRemove permission. Owner can remove anyone. Admins can remove anyone EXCEPT owners
export const removeUsersFromGroupChat = asyncHandler(async (req, res, next) => {
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