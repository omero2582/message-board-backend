import * as dotenv from 'dotenv'
dotenv.config();

import '../config/database.js'

import { addUserToChat, removeUserFromChat } from './chatController.js';
import Chat from '../models/Chat.js';
import User from '../models/User.js';


async function createChat() {
  const newChat = new Chat({
    members: [{ user: '667da605fb156dcfeff16968'}],
    name: 'new chat 2'
  })

  const out = await newChat.save();
  console.log(out);
}

async function addMember() {
  const stark1= '6685e654629ff07e3b4e3a23';
  const ace2 = '667da605fb156dcfeff16968';  // the one I initially added 3 times to the chat

  const chatId = '66920c2f2072e1a6167db491';
  const userId = stark1;
  let myChat = await Chat.findById(chatId);
  let myUser = await User.findById(userId)
  console.log('Before adding')
  console.log('chat: ' + myChat,'user: ' + myUser);

  await addUserToChat(userId, chatId);

  myChat = await Chat.findById(chatId);
  myUser = await User.findById(userId)
  console.log('After Adding')
  console.log('chat: ' + myChat,'user: ' + myUser);
}

async function removeMember() {
  // const stark1= '6685e654629ff07e3b4e3a23';  // wokring id
  const stark1= '6685e654629ff07e3b4e3a2';  // modofied to be non-working id on purpose 
  const ace2 = '667da605fb156dcfeff16968';  // the one I initially added 3 times to the chat

  const chatId = '66920c2f2072e1a6167db491';
  const userId = stark1;
  // let myChat = await Chat.findById(chatId);
  // let myUser = await User.findById(userId)
  // console.log('Before Removing')
  // console.log('chat: ' + myChat,'user: ' + myUser);

  await removeUserFromChat(userId, chatId);

  // myChat = await Chat.findById(chatId);
  // myUser = await User.findById(userId)
  // console.log('After Removing')
  // console.log('chat: ' + myChat,'user: ' + myUser);
}

await removeMember();