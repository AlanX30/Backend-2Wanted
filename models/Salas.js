const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const { Schema } = mongoose

const SalaSchema = new Schema({
    users: [
        { 
           user: {type: String},
           space: {type: Boolean, default: true},
           childsId: {
               childId1: {type: String},
               childId2: {type: String},
           },
           parentId: {type: String},
           active: {type: Boolean, default: true},
           repeated: { type: Number, default: 0}
        }
    ],
    price: { type: Number, required: true, },
    name: { type: String, unique: true, required: true, minLength: 4, maxLength: 16, trim: true},
    creator: {type: String},
    usersNumber: { type: Number, default: 0 },
    paidUsers: { type: Number },
    line123: { type: Number },
    line4: { type: Number }
})

SalaSchema.methods.encryptPassword = async password => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  };
  
  SalaSchema.methods.matchPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

module.exports = mongoose.model('Salas', SalaSchema)