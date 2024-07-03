import '../config/database.js';
import MembershipType from "../models/MembershipType.js";
import Group from '../models/Group.js';
import * as dotenv from 'dotenv'
dotenv.config();

async function createMemeberships() {
  const memberships = [
  { name: 'Free', tier: 0 },
    { name: 'Basic', tier: 1 },
    { name: 'Advanced', tier: 2 },
    { name: 'Pro', tier: 3 },
  ];
  
  for (const { name, tier } of memberships) {
    try {
      const newMembershipType = new MembershipType({
        name, tier
      });
      const membershipType = await newMembershipType.save();
    } catch (err) {
      console.log('error creating membership type', err);
    }
  };  
}

async function createGlobalGroup() {

  try {
    const newGroup = new Group({
      isGlobal: true,
      name: 'Global'
    })
    const group = await newGroup.save();
    console.log('created ' + group)
  } catch (err) {
    console.log('error creating global group', err);
  }

}


async function findGlobalGroup(){
  const globalGroup = await Group.findById(process.env.GLOBAL_GROUP_ID);
  console.log(globalGroup);
}

// await createMemeberships();
// await createGlobalGroup();
await findGlobalGroup();
