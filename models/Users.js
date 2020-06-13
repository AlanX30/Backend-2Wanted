const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const { Schema } = mongoose

const UserSchema = new Schema({
    userName: {type: String, required: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    wallet: {type: Number, default: 0},
    date: { type: Date, default: Date.now },
    invitations: [{
      host: { type: String },
      parentUsername: {type: String},
      message: {type: String},
      price: {type: Number},
      salaId: {type: Schema.Types.ObjectId, ref: 'Salas'},
      salaName: {type: String}
    }]
})

  UserSchema.methods.encryptPassword = async password => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  };
  
  UserSchema.methods.matchPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

module.exports = mongoose.model('Users', UserSchema)