import jwt from 'jsonwebtoken';
import { CustomError } from '../errors/errors.js';

// TODO thinking about throwing a custom error here if sign fails
// you can add a 4th argument which switches this method to being async, and lets you handle the error
export async function signJWT(user){
  // JWT create
  // sync version
  // const token_jwt = jwt.sign(
  //     { sub: user.id },
  //     process.env.JWT_PRIVATE,
  //     { expiresIn: '30d', algorithm: 'RS256' }
  // )
  // return token_jwt;

  // async + Promise. This way we can easily throw the error here so that we have the
  // error isolated as 'Error signing JWT'
  // this line below could alternatively be:  `return new Promise((resolve, reject) => {`
  // which saves us a bit of code, and lets us omit the 'const' and 'return',
  // but I like th current implemetation better, because if I wanted to add more code, I could
  // easily write at the bottom here, instead of having to nest it deeply
  const token_jwt = await new Promise((resolve, reject) => {
    jwt.sign(
      { sub: user.id },
      process.env.JWT_PRIVATE,
      { expiresIn: '30d', algorithm: 'RS256' },
      (err, token) => {
        if(err){
          reject(new CustomError("Error signing JWT", {statusCode: 500} ));
        }
        resolve(token);
      }
    )
  })
  return token_jwt;
}

export function getUserBasic(user){
  if(!user) return undefined;

  const {username, email, id} = user;
  return {username, email, id}
}
// instead of this, inside of the auth middleware 'optionalAuth', we can maybe just
// add a property req.user_basic on top of the req.user. Not sure though if thats better



// TODO
// how to JWT async:
// https://medium.com/@ardipurba/things-to-note-when-signing-and-verifying-jwt-token-in-nodejs-fad0ee4cbfad
// const { sign, verify } = require('jsonwebtoken')

// const token = new Promise((resolve, reject) => {
//   sign({ data: "Your Data" }, "Your_Secret", {}, (err, token) => {
//     if (err) reject(err);
//     else resolve(token)
//   });
// });

// const data = new Promise((resolve, reject) => {
//   verify(token, "Your_Secret", (err, payload) => {
//     if (err) reject(err);
//     else resolve(payload);
//   });
// });