import mongoose from "mongoose";

const Schema = mongoose.Schema;

const MembershipTypeSchema = new Schema({
  name: { type: String, required: true, unique: true },
  tier: { type: Number, required: true, unique: true },
}, {timestamps: true})

MembershipTypeSchema.virtual('isMember').get(function() {
  return this.tier >= 1;
});
// for checking what tier its at, create a middleware

const MembershipType = mongoose.model('MembershipType', MembershipTypeSchema);
export default MembershipType;