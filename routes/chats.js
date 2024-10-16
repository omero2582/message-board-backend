import express from 'express';
import { body, param } from "express-validator";
import { checkValidationErrorsObjKeys } from '../middleware/validationMiddleware.js';
import { authMandatory } from '../middleware/authMiddleware.js';
import { createChat, getChatMessages, addUserToChat, removeUsersFromChat, getChats } from '../controllers/chatController.js'
import { createMessage, deleteMesssage } from '../controllers/messageController.js';

const router = express.Router();

router.post('/chats',
  body("members").isArray({min: 1}).withMessage("members must be an array with at least 1 elements"),
  body('members.*').isMongoId().withMessage('Invalid individual memberId format'),
  body("name").optional().trim().isLength({min: 1}),
  body("type").default("direct").isIn(["direct", "group"]).trim(),
  checkValidationErrorsObjKeys,
  authMandatory,
  createChat
)

router.get('/chats',
  checkValidationErrorsObjKeys,
  authMandatory,
  getChats,
)


// router.get('/chats/:chatId',
//   param("chatId").isMongoId().withMessage('Invalid chatId format'),
//   checkValidationErrorsObjKeys,
//   authMandatory,
//   getChat
// )

// Messages return with most-recent first
// TODO implement pagination later
router.get('/chats/:chatId/messages',
  param("chatId").isMongoId().withMessage('Invalid chatId format'),
  checkValidationErrorsObjKeys,
  authMandatory,
  getChatMessages
)

//
// below 2 routes are from message controler, debating if change to chat controller

router.post('/chats/:chatId/messages/',
  body("content", "Content must be specified").trim().isLength({min: 1}),
  param("chatId").isMongoId().withMessage('Invalid chatId format'),
  checkValidationErrorsObjKeys,
  authMandatory,
  createMessage
)

// debating /messages/:messageId vs chat/:chatId/messages/:messageId
// groupId is unncessary to specify since we will need to grab this from message itself,
// but maybe it improves readility
router.delete('/messages/:messageId',
  param("messageId").isMongoId().withMessage('Invalid messageId format'),
  checkValidationErrorsObjKeys,
  authMandatory,
  deleteMesssage
)

export default router;
