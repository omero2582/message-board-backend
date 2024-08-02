import jwt from 'jsonwebtoken';
import { CustomError } from '../errors/errors';

// TODO thinking about throwing a custom error here if sign fails
// you can add a 4th argument which switches this method to being async, and lets you handle the error
export function signJWT(user){
  // JWT create
  // sync version
  // const token_jwt = jwt.sign(
  //     { sub: user.id },
  //     process.env.JWT_PRIVATE,
  //     { expiresIn: '30d', algorithm: 'RS256' }
  // )
  // return token_jwt;

  // async version
  // can maybe use callback at the end to throw CustomError here. This way I don't have to
  // catch for this signJWT error elsewhere when I call this signJWT function
  const token_jwt = jwt.sign(
    { sub: user.id },
    process.env.JWT_PRIVATE,
    { expiresIn: '30d', algorithm: 'RS256' },
    (err, token) => {
      if(err){
        throw new CustomError("Error signing JWT", {statusCode: 500} );
      }
      return token;
    }
  )
return token_jwt;
}

export function getUserBasic(user){
  if(!user) return undefined;

  const {username, email, id} = user;
  return {username, email, id}
}
// instead of this, inside of the auth middleware 'optionalAuth', we can maybe just
// add a property req.user_basic on top of the req.user. Not sure though if thats better