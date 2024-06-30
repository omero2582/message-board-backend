import mongoose from "mongoose";

const Schema = mongoose.Schema;

const GroupSchema = new Schema({
  name: { type: String, required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'User'}],
  isGlobal: { type: Boolean, default: false}
});

const Group = mongoose.model('Group', GroupSchema);
export default Group;