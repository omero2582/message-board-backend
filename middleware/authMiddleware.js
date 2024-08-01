import passport from "passport";
import asyncHandler from 'express-async-handler';

// TODO wrap these in asynchandler

// export const authMandatory = asyncHandler(async (req, res, next) => {
//   passport.authenticate( "jwt", {session: false})(req, res, next);
// });

export async function authMandatory (req, res, next) {
  passport.authenticate( "jwt", {session: false})(req, res, next);
};
// export function authMandatory(req, res, next) {
//   asyncHandler(async () => {
//     passport.authenticate("jwt", { session: false })(req, res, next);
//   })(req, res, next);
// }

export async function authOptional (req, res, next) {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (user) {
      req.user = user;
    }
    next();
  })(req, res, next);
}

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