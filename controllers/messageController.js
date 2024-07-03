import Group from "../models/Group";
import Message from "../models/Message";
import User from "../models/User";

// middleware will prob move this somewhere
function errorIfUserNotInOptionalGroup(user, group) {
  // If its a group message, then if user is not a member of the group, then error
  if(group){
    const isMemberInGroup = group.isMemberInGroup(user.id);
    // const isMemberInGroup = group.isGlobal || group.members.some(u => u.id === req.user.id);
    if(!isMemberInGroup){
      return res.status(401).json({error: 'User does not belong to this group'})
    }
  }
}

export async function deleteMesssage(req, res, next) {
  const messageId = req.params.messageId;

  const message = await Message.findById(messageId).populate({
    path: 'group',
    populate: {
      path: 'members',
      model: 'User'
    }
  });
  if(!message){
    return res.status(404).json({error: 'Message not found'})
  }

  const isSender = req.user.id === message.sender;
  if(!isSender){
    return res.status(401).json({error: 'User is not the sender of this message'})
  }

  // const messageGroup = message.group;
  // middleware kind of
  errorIfUserNotInOptionalGroup(req.user, message.group);

  // Otherwise, success. Can be either group message or private message. For private message, they just
  // need to be sender
  const result = await message.deleteOne();
  return res.json({message: 'success', result})

  // if(isMemberInGroup){
  //   const result = await message.deleteOne();
  //   return res.json({message: 'success', result})
  // }else{
  //   return res.status(401).json({error: 'User does not belong to this group'})
  // }
}

export async function createMessage(req, res, next){
  const {content, group, recipients} = matchedData(req);

  // need to check that this group exists
  // moved this to schema middleware
  // const groupFound = await Group.findById(group);
  // if(!groupFound){
  //   return res.status(404).json({error: 'Group not Found'});
  // }
  
  const newMesasge = new Message({
   sender: req.user.id,
   content,
   group,
   recipients
  });
  errorIfUserNotInOptionalGroup(req.user, groupFound);
  
  // TODO not sure if we should check if ALL recipients exist, or if at least 1 exists, or if we care at all
  // maybe if any exists for now
  try {
    const recipientsFound = await User.find({
      _id: { $in: recipients }
    });
  } catch (error) {
    return res.status(404).json({error: 'recipients not found'})
  }
  // TODO check above, using errors to catch if ANY recipient fails. check if this acutally works


  const message = await newMesasge.save();
  res.json({message: 'Message sent successfully', new: message})
}