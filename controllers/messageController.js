import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import { matchedData } from "express-validator";
import asyncHandler from 'express-async-handler';
import { CustomError } from "../errors/errors.js";

export const createMessage = asyncHandler(async (req, res, next) => {
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
    throw new CustomError("Message not Found", {statusCode: 404} );
  }

  // Permissions
  // if not Admin, then check
  if(!req.user.isAdmin){
    const isMemberInGroup = message.chat.isMemberInGroup(req.user.id);
    if(!isMemberInGroup){
      throw new CustomError('User does not belong to this group', {statusCode: 401});
    }

    const isSender = req.user.id === message.sender.toString();
    if(!isSender){
      throw new CustomError('User is not the sender of this message', {statusCode: 401});
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
});



  
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
