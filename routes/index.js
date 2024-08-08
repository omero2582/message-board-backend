import express from 'express';
import { body, validationResult, matchedData, param } from "express-validator";
import asyncHandler from 'express-async-handler';
import { signJWT, getUserBasic } from '../utils/utils.js';
import { authOptional, authMandatory } from '../middleware/authMiddleware.js';
import { login, signup } from '../controllers/authController.js';
import { createMessage, deleteMesssage, } from '../controllers/messageController.js';
import { createChat, getChat, getChatMessages } from '../controllers/chatController.js';
import { CustomError } from '../errors/errors.js';

const router = express.Router();

// Returns errors in {errors: [ {} ]}
const checkValidationErrorsArray = asyncHandler( async (req, res, next) =>{
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation Error',{statusCode: 400, errors: errors.array()});
  }
  next();
});

// Returns errors in {errors: { firsName: {} }}
const checkValidationErrorsObjKeys = asyncHandler( async (req, res, next) =>{
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new CustomError('Validation Error',{statusCode: 400, errors: errors.mapped()});
  }
  next();
});

// Returns errors in {errors: { firsName: [] }}
const checkValidationErrorsObjKeysArray = asyncHandler( async (req, res, next) =>{
  const errorsRaw = validationResult(req);
  const errors = errorsRaw.array().reduce((sum, cur) => {
    if(!sum[cur.path]){
      sum[cur.path] = [];
    }
    sum[cur.path].push(cur)
    return sum;
  }, {})

  if (!errorsRaw.isEmpty()) {
    throw new CustomError('Validation Error',{statusCode: 400, errors});
  }
  next();
});


router.get('/',
  authOptional,
  asyncHandler(async (req, res) => {
    res.json({messsage:`success`, user: getUserBasic(req.user)})
  })
)

router.get('/protected',
  authMandatory,
  asyncHandler(async (req, res) => {
    res.json({messsage:`success`, user: getUserBasic(req.user)})
  })
)

//
//
//
// TODO TODO
// maybe change out validation chains below to use an array as a varaibale,
// for example const validateUser = [body(), body(), body(), checkValidationErrorsMap()]
// then our route just uses 1 of these. This would then be more similar to how we'd use Zod,
// where we'd have 1 folder/file with each of our validation schemas

// can also mayb change our controller function calls to be prepended with its controller file
// for example instead of 'router.post(/sign-up, signup)' do 'router.post(/sign-up, authController.signup)'
// I dont really like this though, so probably dont add this. I cant foresee the benefit of doing this

router.post('/sign-up',
  body("firstName", "First Name must be specified").trim().isLength({min: 1}),
  body("lastName", "Last Name must be specified").trim().isLength({min: 1}),
  body("email", "Invalid Email Format").trim().isLength({min: 1}).isEmail(),
  body("username", "Username must be specified").trim().isLength({min: 1}),
  body("password", "Password must be at least 6 characters").isLength({min: 6}),
  // body("password", "Password must be specified").isLength({min: 6}).withMessage("Password must be at least 6 characters"),
  checkValidationErrorsObjKeys,
  signup
);

router.post('/log-in', 
  body("username", "Username must be specified").trim().isLength({min: 1}),
  body("password", "Password must be specified").trim().isLength({min: 1}),
  checkValidationErrorsObjKeys,
  login
);

router.get('/log-out', () => {
  // Do nothing. With this JWT implementation, we simply delete the clientside stored JWT
  // in the future, I'd like a 'log out all sessions', but this should require a more complex implementation
})

//
//
//

router.post('/chats/',
  body("members").isArray({min: 2}).withMessage("members must be an array with at least 2 elements"),
  body('members.*').isMongoId().withMessage('Invalid individual memberId format'),
  body("name").optional().trim().isLength({min: 1}),
  body("isGroupChat").optional().trim().isBoolean().withMessage("isGroupChat must be a boolean"),
  body("isGlobal").optional().trim().isBoolean().withMessage("isGlobal must be a boolean"),
  checkValidationErrorsObjKeys,
  authMandatory,
  createChat
)


router.get('/chats/:chatId',
  param("chatId").isMongoId().withMessage('Invalid chatId format'),
  checkValidationErrorsObjKeys,
  authMandatory,
  getChat
)

// Messages return with most-recent first
// TODO implement pagination later
router.get('/chats/:chatId/messages',
  param("chatId").isMongoId().withMessage('Invalid chatId format'),
  checkValidationErrorsObjKeys,
  authMandatory,
  getChatMessages
)

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