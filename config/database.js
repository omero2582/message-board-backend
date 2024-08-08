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

await dbStart();
export const allMemberships = await getAllMemberships();