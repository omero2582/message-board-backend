import User from '../models/User.js';
import { signJWT } from '../helpers/helpers.js';
import bcrypt from 'bcryptjs'
import { body, validationResult, matchedData } from "express-validator";
import { allMemberships } from '../config/database.js';
import asyncHandler from 'express-async-handler';
import { CustomError } from '../errors/errors.js';

export const login = asyncHandler(async (req, res, next) => {
  const {username, password} = matchedData(req);
  
  try {
    const user = await User.findOne({ username });
    if (!user) {
      throw new CustomError('Could not find User', {statusCode: 401} );
      // return res.status(401).json({error: "could not find user"})
    };
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new CustomError("Incorrect password", {statusCode: 401} );
    }
    const token_jwt = signJWT(user);
    return res.json({ user, token_jwt })
  } catch(err) {
    return next(err)
  };
  //

})

export const signup = asyncHandler(async (req, res, next) => {
  // const {firstName, lastName, username, password} = req.body;
  const {firstName, lastName, username, password, email} = matchedData(req);
  //same as above but extra layer ensures ONLY data the apssed vlidation sanitation is here


  bcrypt.hash(password, 10, async (err, hashedPassword) => {
    // if err, do something
    if(err){
      throw new CustomError("Error creating password", {statusCode: 500} );
    }
    
    // otherwise, store user with hashedPassword in DB
    try {
      const newUser = new User({
        firstName,
        lastName,
        username,
        password: hashedPassword,
        email,
        membership: allMemberships.find(m => m.tier === 0),
      });
      const user = await newUser.save();
      const token_jwt = signJWT(user);
      
      res.json({ user, token_jwt })
  } catch(err) {
    throw new CustomError("Error Creating User", {statusCode: 500} );
  };
  });
})