import express from 'express';
import { body, validationResult, matchedData } from "express-validator";
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
  asyncHandler(signup)
);

router.post('/log-in', 
  body("username", "Username must be specified").trim().isLength({min: 1}).escape(),
  body("password", "Password must be specified").trim().isLength({min: 1}).escape(),
  asyncHandler(login)
);

router.get('/log-out', () => {
  // Do nothing. With this JWT implementation, we simply delete the clientside stored JWT
  // in the future, I'd like a 'log out all sessions', but this should require a more complex implementation
})

// new?
// debating /messages/:messageId vs groups/:groupId/messages/:messageId
// groupId is unncessary to specify since we will need to grab this from message itself,
// but maybe it improves readility

// just wrote below. previously signup and login are using this isnisde of the ocntroller funcitons
// themselves, but will just use this for the routes below
async function checkValidationErrors(req, res, next){
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({errors: errors.array()});
  }
  next();
}

router.delete('/messages/:messageId',
  checkValidationErrors,
  authMandatory,
  asyncHandler(deleteMesssage)
)

router.post('/messages/',
  body("content", "Content must be specified").trim().isLength({min: 1}).escape(),
  body("chat", "Chat must be specified").trim().isLength({min: 1}).escape(),
  checkValidationErrors,
  authMandatory,
  asyncHandler(createMessage)
)

router.post('/chats/',
  body("name", "First Name must be specified").trim().isLength({min: 1}).escape(),
  body("members").optional().isArray().withMessage("members must be an array"),
  body("isGroupChat").optional().trim().isBoolean().withMessage("isGroupChat must be a boolean").escape(),
  body("isGlobal").optional().trim().isBoolean().withMessage("isGlobal must be a boolean").escape(),
  checkValidationErrors,
  authMandatory,
  asyncHandler(createChat)
)

router.get('/chats/:chatId',
  checkValidationErrors,
  authMandatory,
  asyncHandler(getChat)
)

router.get('/chats/:chatId/messages',
  checkValidationErrors,
  authMandatory,
  asyncHandler(getChatMessages)
)

export default router;
