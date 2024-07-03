import mongoose from "mongoose";
import User from "./User";

const Schema = mongoose.Schema;

const GroupSchema = new Schema({
  name: { type: String, required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User'}],
  isGlobal: { type: Boolean, default: false}
});

GroupSchema.methods.isMemberInGroup = function (userId) {
  return this.isGlobal || this.members.some(m => m.id === userId);
};


const Group = mongoose.model('Group', GroupSchema);
export default Group;