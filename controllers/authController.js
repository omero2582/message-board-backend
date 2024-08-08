import User from '../models/User.js';
import { signJWT } from '../utils/utils.js';
import bcrypt from 'bcryptjs'
import { body, validationResult, matchedData } from "express-validator";
import { allMemberships } from '../config/database.js';
import asyncHandler from 'express-async-handler';
import { CustomError } from '../errors/errors.js';

export const login = asyncHandler(async (req, res, next) => {
  const {username, password} = matchedData(req);
  
  const user = await User.findOne({ username });
  if (!user) {
    throw new CustomError('Could not find User', {statusCode: 401} );
  };

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new CustomError("Incorrect password", {statusCode: 401} );
  }

  // issue JWT
  const token_jwt = await signJWT(user);
  return res.json({ user, token_jwt })
})

export const signup = asyncHandler(async (req, res, next) => {
  // const {firstName, lastName, username, password} = req.body;
  const {firstName, lastName, username, password, email} = matchedData(req);
  //same as above but extra layer ensures ONLY data the passed vlidation sanitation is here

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 10);
  } catch (error) {
    throw new CustomError("Error hashing password", {statusCode: 500} )
  }
    
  // otherwise, store user with hashedPassword in DB
  let user;
  try {
    const newUser = new User({
      firstName,
      lastName,
      username,
      password: hashedPassword,
      email,
      membership: allMemberships.find(m => m.tier === 0),
    });
    user = await newUser.save();
  } catch(err) {
    throw new CustomError("Error Creating User", {statusCode: 500} );
  };

    const token_jwt = await signJWT(user);
    res.json({ user, token_jwt })
  }
)