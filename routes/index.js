import express from 'express';
import { body, validationResult, matchedData, param } from "express-validator";
import asyncHandler from 'express-async-handler';
import { signJWT, getUserBasic } from '../utils/utils.js';
import { authOptional, authMandatory } from '../middleware/authMiddleware.js';
import { login, signup } from '../controllers/authController.js';
import { checkValidationErrorsObjKeys } from '../middleware/validationMiddleware.js';

const router = express.Router();

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

export default router;