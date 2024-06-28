import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  first_name: { type: String, required: true, maxLength: 100 },
  last_name: { type: String, required: true, maxLength: 100 },
  username: { type: String, unique: true, required: true, maxLength: 20 },
  email: { type: String, unique: true, required: true, maxLength: 20 },
  password: { type: String, required: true }
  // maxLength wont matter on password because I will only store the bycrypt hashed version
}, {timestamps: true});

UserSchema.virtual('full_name').get(function() {
  const firstName = this.first_name || '';
  const lastName = this.last_name || '';
  return `${firstName} ${lastName}`.trim();
})

// Below creates unique indexes on single fields, not necessary since this model will create
// the unique indexes when we call new Schema(). The thing is, mongoDB CANNOT create a unique index
// in any way if the collection already contains duplicates. The only way around this is to delete
// all duplicates first/ensure the field does not contain duplicates
// UserSchema.index({ username: 1}, { unique: true });
// UserSchema.index({ email: 1}, { unique: true });

// Below creates unique index for combined field. In other words, the combination has to be unique
// This one is handy, though you only have to create mongoDB indexes once, and it can be 
// done either in JS, mongodb shell/command line, or using mongoDB Atlas GUI
// UserSchema.index({ username: 1, email: 1 }, { unique: true });


const User = mongoose.model('User', UserSchema);
export default User;