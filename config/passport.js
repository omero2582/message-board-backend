import passport from "passport";
import User from '../models/User.js';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as dotenv from 'dotenv'
import mongoose from "mongoose";
import { CustomError } from "../errors/errors.js";
dotenv.config();

// I think I should maybe combine middleware/authMiddleware.js and this file, because they are targetting
// the same purposes, and doesnt make sense to keep them separated

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_PUBLIC,
  algoriths: ['RS256']
};

passport.use(
  new Strategy(opts, async (payload, done) => {
    // try/catch because findById can throw unexpected errors, although not sure what this does
    // if i am just calling done(error) on it anyways
    try {
      // Validating/Sanitizing payload
      if(!mongoose.isValidObjectId(payload.sub)){
        throw new CustomError('Invalid User ID on JSON Web Token payload', {statusCode: 400});
      }

      // Proceed
      const user = await User.findById(payload.sub);
      if (user) {
        return done(null, user);
      } else {
        return done(null, false)
      }
    } catch (error) {
      return done(error, false);
      // TODO, we just changed above form null to false, check if this all still works
      // the docs have false, the tutorial had null. Seems false is the correct value
    }
  })
);