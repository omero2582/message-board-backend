import User from '../models/User.js';
import { signJWT } from '../helpers/helpers.js';
import bcrypt from 'bcryptjs'
import { body, validationResult, matchedData } from "express-validator";
import { allMemberships } from '../config/database.js';

export async function login(req, res, next) {
  const {username, password} = matchedData(req);
  
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({error: "could not find user"})
    };
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({error: "Incorrect password"})
    }
    const token_jwt = signJWT(user);
    return res.json({ user, token_jwt })
  } catch(err) {
    return next(err)
  };
  //

};

export async function signup(req, res, next) {
  // const {first_name, last_name, username, password} = req.body;
  const {first_name, last_name, username, password, email} = matchedData(req);
  //same as above but extra layer ensures ONLY data the apssed vlidation sanitation is here


  bcrypt.hash(password, 10, async (err, hashedPassword) => {
    // if err, do something
    // otherwise, store hashedPassword in DB
    if(err){
      return next(err);
    }
    
    try {
      const newUser = new User({
        first_name,
        last_name,
        username,
        password: hashedPassword,
        email,
        membership: allMemberships.find(m => m.tier === 0),
      });
      const user = await newUser.save();
      const token_jwt = signJWT(user);
      
      res.json({ user, token_jwt })
  } catch(err) {
    console.log('catch');
    return next(err);
  };
  });
}