import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import { matchedData } from "express-validator";
import asyncHandler from 'express-async-handler';
import { AuthorizationError, CustomError, NotFoundError } from "../errors/errors.js";

export const createMessage = asyncHandler(async (req, res, next) => {
  const { content, chatId } = matchedData(req);

  const message = new Message({
   sender: req.user.id,
   content,
   chat: chatId,
  });
  
  const chat = await Chat.findById(chatId);
  if(!chat){
    throw new NotFoundError("Chat not Found");
  }

  // Permissions
  // Admins dont skip these checks
  const isMemberInGroup = chat.isMemberInGroup(req.user.id);
  if(!isMemberInGroup){
    throw new AuthorizationError('User does not belong to this group');
  }

  // Proceed
  try {
    await message.save();
    return res.json({message});
  } catch (error) {
    throw new CustomError('Error saving new message');
  }
});

export const deleteMesssage = asyncHandler(async (req, res, next) => {
  const { messageId } = matchedData(req);

  const message = await Message.findById(messageId).populate({
    path: 'chat',
    populate: {
      path: 'members',
      model: 'User'
    }
  });
  
  if(!message){
    throw new NotFoundError("Message not Found");
  }

  // Permissions
  // Admins skip all checks
  if(!req.user.isAdmin){
    const isMemberInGroup = message.chat.isMemberInGroup(req.user.id);
    if(!isMemberInGroup){
      throw new AuthorizationError('User does not belong to this group');
    }

    // const isSender = req.user.id === message.sender.toString();
    const isSender = req.user.equals(message.sender);
    // check if this .equals code works ^^
    if(!isSender){
      throw new AuthorizationError('User is not the sender of this message');
    }
  }

  // Proceed
  const result = await message.deleteOne();
  if (result.deletedCount === 0){
    throw new CustomError('Error deleting message', {statusCode: 500})
  }

  return res.json({result, message})
});

  
// TODO TODO no longer using block commented out below, just here in case for long in future/another proj
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
