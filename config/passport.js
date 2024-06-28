import passport from "passport";
import User from '../models/User.js';
import { ExtractJwt, Strategy } from 'passport-jwt';
import * as dotenv from 'dotenv'
dotenv.config();

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_PUBLIC,
  algoriths: ['RS256']
};

passport.use(
  new Strategy(opts, async (payload, done) => {
    try {
      const user = await User.findById(payload.sub);
      if (user) {
        return done(null, user);
      } else {
        return done(null, false)
      }
    } catch (error) {
      return done(error, null);
    }
  })
);