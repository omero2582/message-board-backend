import mongoose from 'mongoose';
import * as dotenv from 'dotenv'
import MembershipType from '../models/MembershipType.js';
dotenv.config();

async function dbStart(){
  try {
    await mongoose.connect(process.env.DB_URL);
    mongoose.connection.on('error', () => {
      console.log('Mongoose error event')
    })
    console.log('Connected to Database')
  } catch (error) {
    console.log('Mongoose error on intial connection')
  }
}

async function getAllMemberships (){
  const out = await MembershipType.find();
  console.log('retrieved all memberships')
  return out;
}

//  https://www.mongodb.com/docs/drivers/node/current/fundamentals/transactions/
//  https://mongoosejs.com/docs/transactions.html
export async function runTransaction(session, transactionCallback) {
  // this fn assumes that you called const session = await mongoose.startSession();
  // and passed this session in as an argument
  try {
    session.startTransaction();
  
    await transactionCallback();

    await session.commitTransaction();
    
  } catch (error) {
    // Abort the transaction
    await session.abortTransaction();
    console.log('ABORTING TRANSACTION', error);
  } finally {
    await session.endSession();
  }
}

await dbStart();
export const allMemberships = await getAllMemberships();