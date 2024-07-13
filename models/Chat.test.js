import * as dotenv from 'dotenv'
dotenv.config();

import Chat from "./Chat.js";
import '../config/database.js';


async function createChat() {
  const newChat = new Chat({
    members: [{ user: '667da605fb156dcfeff16968'}],
    name: 'new chat 2'
  })

  const out = await newChat.save();
  console.log(out);
}

async function removeMember() {
  
}

async function addMember() {
  // const myChat = await Chat.findById('66920c2f2072e1a6167db491');
  await Chat.addUserToChat('667da605fb156dcfeff16968', '66920c2f2072e1a6167db491');
}

await addMember();