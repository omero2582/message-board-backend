import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  firstName: { type: String, required: true, maxLength: 100 },
  lastName: { type: String, required: true, maxLength: 100 },
  username: { type: String, unique: true, required: true, maxLength: 20 },
  email: { type: String, unique: true, required: true, maxLength: 20 },
  password: { type: String, required: true },
  // maxLength wont matter on password because I will only store the bycrypt hashed version
  membership: { type: Schema.Types.ObjectId, required: true, ref: 'MembershipType' },
  isAdmin: { type: Boolean, default: false },
  chats: [{ 
    _id: false, // TODO maybe just make _id equal the id value below
    id: { type: Schema.Types.ObjectId, ref: 'Chat' },
    isOpened: { type: Boolean, default: true },
    // nice to have 'isOpened' here, because then I dont have to fetch
    // any Chats information, unless isOpened is set to true here
  }]
}, {timestamps: true});

UserSchema.virtual('fullName').get(function() {
  const firstName = this.firstName || '';
  const lastName = this.lastName || '';
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