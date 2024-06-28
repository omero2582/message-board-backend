import jwt from 'jsonwebtoken';

export function signJWT(user){
  // JWT create
  const token_jwt = jwt.sign(
      { sub: user.id },
      process.env.JWT_PRIVATE,
      { expiresIn: '30d', algorithm: 'RS256' }
  )
  return token_jwt;
}

export function getUserBasic(user){
  const {username, email, id} = user;
  return {username, email, id}
}
// instead of this, inside of the auth middleware 'optionalAuth', we can maybe just
// add a property req.user_basic on top of the req.user. Not sure though if thats better