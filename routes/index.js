import express from 'express';
import { body, validationResult, matchedData, param } from "express-validator";
import asyncHandler from 'express-async-handler';
import { signJWT, getUserBasic } from '../helpers/helpers.js';
import { authOptional, authMandatory } from '../middleware/authMiddleware.js';
import { login, signup } from '../controllers/authController.js';
import { createMessage, deleteMesssage, } from '../controllers/messageController.js';
import { createChat, getChat, getChatMessages } from '../controllers/chatController.js';

const router = express.Router();

async function checkValidationErrors(req, res, next){
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(500).json({errors: errors.array()});
  }
  next();
}

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
  body("firstName", "First Name must be specified").trim().isLength({min: 1}).escape(),
  body("lastName", "Last Name must be specified").trim().isLength({min: 1}).escape(),
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

// debating /messages/:messageId vs chat/:chatId/messages/:messageId
// groupId is unncessary to specify since we will need to grab this from message itself,
// but maybe it improves readility
router.delete('/messages/:messageId',
  param("messageId").isMongoId().withMessage('Invalid messageId format').escape(),
  authMandatory,
  asyncHandler(deleteMesssage)
)

router.post('/chats/',
  body("members").isArray({min: 2}).withMessage("members must be an array with at least 2 elements"),
  body('members.*').isMongoId().withMessage('Invalid individual memberId format').escape(),
  body("name").optional().trim().isLength({min: 1}).escape(),
  body("isGroupChat").optional().trim().isBoolean().withMessage("isGroupChat must be a boolean").escape(),
  body("isGlobal").optional().trim().isBoolean().withMessage("isGlobal must be a boolean").escape(),
  checkValidationErrors,
  authMandatory,
  asyncHandler(createChat)
)


router.get('/chats/:chatId',
  param("chatId").isMongoId().withMessage('Invalid chatId format').escape(),
  authMandatory,
  asyncHandler(getChat)
)

// Messages return with most-recent first
// TODO implement pagination later
router.get('/chats/:chatId/messages',
  param("chatId").isMongoId().withMessage('Invalid chatId format').escape(),
  authMandatory,
  asyncHandler(getChatMessages)
)

router.post('/chats/:chatId/messages/',
  body("content", "Content must be specified").trim().isLength({min: 1}).escape(),
  param("chatId").isMongoId().withMessage('Invalid chatId format').escape(),
  checkValidationErrors,
  authMandatory,
  asyncHandler(createMessage)
)
export default router;

// TODO probably change the unathorized response from passport, when failing mandatory auth