const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const { Schema } = mongoose

const UserSchema = new Schema({
    userName: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    notifications: {type: Number, default: 0},
    wallet: {type: Number, default: 0},
    date: { type: Date, default: Date.now },
    dni: {type: String, required: true },
    bank: {
      titular: {type: String},
      tipo: {type: String},
      dni: {type: String},
      banco: {type: String},
      numeroCuenta: {type: String},
      tipoCuenta: {type: String}
    }
})

  UserSchema.methods.encryptPassword = async password => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  };
  
  UserSchema.methods.matchPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

module.exports = mongoose.model('Users', UserSchema)