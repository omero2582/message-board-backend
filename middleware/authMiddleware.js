import passport from "passport";
import asyncHandler from 'express-async-handler';
import { CustomError } from "../errors/errors.js";

// export const authMandatory = asyncHandler(async (req, res, next) => {
//   passport.authenticate( "jwt", {session: false})(req, res, next);
// });
export const authMandatory = asyncHandler(async (req, res, next) => {
  passport.authenticate( "jwt", {session: false}, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (user) {
      req.user = user;
      next();
    } else {
      throw new CustomError('Unauthorized', {statusCode: 401})
    }
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

//