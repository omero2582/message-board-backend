import passport from "passport";
import asyncHandler from 'express-async-handler';
import { CustomError } from "../errors/errors.js";

// TODO, the actual authentication (passport strategy) happens in config/passport.js
// I think I should probably combine config/passport.js and this file, because they are targetting
// the same purposes, and doesnt make sense to keep them separated

// PREV default auth. Changed this to fn below, to change the response to proper err response instead of text response
// export const authMandatory = asyncHandler(async (req, res, next) => {
//   passport.authenticate( "jwt", {session: false})(req, res, next);
// });

// TODO - Important - Error Handling 
// The errors in callbacks inside of controller functions, need to pass their errors to next(err) like we do below,
// because otherwise they would NOT be caught by asyncHanlder nor caught by the catch-all middleware
// I believe another way to solve it, would be by wrapping passport.authenticate inisde of a promise/promisify,
// then calling resolve(output) or reject(err) inside of the callback
// We do this in utils.signJWT. But just using next(new CustomError) here is much simpler

// README - execution order
// passport.authenticate here will call the code we defined with passport.use(new Strategy) in config/passport.js
// That code will then call 'done()', which will call the callback we define here inside of passport.autheticate (third argument)
export const authMandatory = asyncHandler(async (req, res, next) => {
  passport.authenticate( "jwt", {session: false}, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {      
      return next(new CustomError('Unauthorized', {statusCode: 401}))
    }
    req.user = user;
    return next();
  })(req, res, next);
});

export const authOptional = asyncHandler(async (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
})

// new conditional membership tiers. Use this on top of one of the check above
const checkTier = (requiredTier) => {
  return (req, res, next) => {
    const userTier = req.user.membershipTier; // Assume you store the user's tier in the req.user object
    if (userTier >= requiredTier) {
      return next();
    } else {
      return res.status(403).json(
        { message: `Insufficient membership tier. Requires Tier ${requiredTier
          }, user only has Tier ${userTier}` });
    }
  };
};