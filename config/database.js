import mongoose from 'mongoose';
import * as dotenv from 'dotenv'
dotenv.config();

async function dbStart(){
  try {
    await mongoose.connect(process.env.DB_URL);
    mongoose.connection.on('error', () => {
      console.log('Mongoose error event')
    })
  } catch (error) {
    console.log('Mongoose error on intial connection')
  }
}

dbStart();