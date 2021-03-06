const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const { Schema } = mongoose

const UserSchema = new Schema({
    userName: {type: String, required: true, unique: true, trim: true},
    email: {type: String, required: true, lowercase: true, trim: true},
    emailHash: {type: String },
    forgotHash: {type: String },
    firstDeposit: {type: Boolean, default: true },
    isVerified: {type: Boolean, default: false },
    password: {type: String, required: true, trim: true},
    notifications: {type: Number, default: 0},
    idWallet: {type: String},
    addressWallet: {type: String},
    accessToken: {type: String},
    idNotifications: {type: String},
    wallet: {type: Number, default: 0},
    reserveWallet: { type: Number },
    date: { type: Date, default: Date.now},
})

  UserSchema.methods.encryptPassword = async password => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  };
  
  UserSchema.methods.matchPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

module.exports = mongoose.model('Users', UserSchema)