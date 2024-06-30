import express from 'express';
import { body, validationResult, matchedData } from "express-validator";
import asyncHandler from 'express-async-handler';
import { signJWT, getUserBasic } from '../helpers/helpers.js';
import { authOptional, authMandatory } from '../middleware/authMiddleware.js';
import { login, signup } from '../controllers/authController.js';

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
// seems like the group is unncessary, but maybe it imporves readility
router.delete('', asyncHandler((req, res, next) => {
    const messageId = req.params.messageId;
  })
)



export default router;
