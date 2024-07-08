import express from 'express';
import { body, validationResult, matchedData, param } from "express-validator";
import asyncHandler from 'express-async-handler';
import { signJWT, getUserBasic } from '../helpers/helpers.js';
import { authOptional, authMandatory } from '../middleware/authMiddleware.js';
import { login, signup } from '../controllers/authController.js';
import { createChat, createMessage, deleteMesssage, getChat, getChatMessages } from '../controllers/messageController.js';

const router = express.Router();

router.get('/',
  authOptional,
  async (req, res, next) => {
    res.json({messsage:`success`, user: getUserBasic(req.user)})
  }
)

router.get('/protected',
  authMandatory,
  async (req, res, next) => {
    res.json({messsage:`success`, user: getUserBasic(req.user)})
  }
)

router.post('/sign-up',
  body("first_name", "First Name must be specified").trim().isLength({min: 1}).escape(),
  body("last_name", "Last Name must be specified").trim().isLength({min: 1}).escape(),
  body("username", "Username must be specified").trim().isLength({min: 1}).escape(),
  body("password", "Password must be specified").trim().isLength({min: 1}).escape(),
  body("email", "Email must be specified").trim().isLength({min: 1}).isEmail().withMessage("Invalid Email Format").escape(),
  checkValidationErrors,
  asyncHandler(signup)
);

router.post('/log-in', 
  body("username", "Username must be specified").trim().isLength({min: 1}).escape(),
  body("password", "Password must be specified").trim().isLength({min: 1}).escape(),
  checkValidationErrors,
  asyncHandler(login)
);

router.get('/log-out', () => {
  // Do nothing. With this JWT implementation, we simply delete the clientside stored JWT
  // in the future, I'd like a 'log out all sessions', but this should require a more complex implementation
})

// new?
// debating /messages/:messageId vs chat/:chatId/messages/:messageId
// groupId is unncessary to specify since we will need to grab this from message itself,
// but maybe it improves readility

async function checkValidationErrors(req, res, next){
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(500).json({errors: errors.array()});
  }
  next();
}

// TODO change this - create 1 route for starting a dm between 2 people
// and 1 route for starting a group with yourself as the sole member 
// maybe make the division inside of the function 'createChat', which will either
// call th efucntion 'Group
router.post('/chats/',
  body("name").optional().trim().isLength({min: 1}).escape(),
  body("members").isArray().withMessage("members must be an array"),
  // ^^ TODO make members required here and in Schema
  body('members.*').escape(),
  body("isGroupChat").optional().trim().isBoolean().withMessage("isGroupChat must be a boolean").escape(),
  body("isGlobal").optional().trim().isBoolean().withMessage("isGlobal must be a boolean").escape(),
  checkValidationErrors,
  authMandatory,
  asyncHandler(createChat)
)

router.post('/chats/private'), // ???? not sure how to make the separaion bwteen the cretin of 2 types of chat
// should the division be a route thing, or a function thing,. or a schema thing
// wokring above

router.delete('/messages/:messageId',
  param("messageId").escape(),
  authMandatory,
  asyncHandler(deleteMesssage)
)

router.get('/chats/:chatId',
  param("chatId").escape(),
  authMandatory,
  asyncHandler(getChat)
)

// Messages return with most-recent first
// TODO implement pagination later
router.get('/chats/:chatId/messages',
  param("chatId").escape(),
  authMandatory,
  asyncHandler(getChatMessages)
)

router.post('/chats/:chatId/messages/',
  body("content", "Content must be specified").trim().isLength({min: 1}).escape(),
  param("chatId").escape(),
  checkValidationErrors,
  authMandatory,
  asyncHandler(createMessage)
)
export default router;

// TODO probably change the unathorized response from passport, when failing mandatory auth