const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const { Schema } = mongoose

const SalaSchema = new Schema({
    users: [
        { 
           user: {type: String},
           space: {type: String, default: 'true'},
           childsId: {
               childId1: {type: String},
               childId2: {type: String},
           },
           parentId: {type: String}
        }
    ],
    price: { type: Number },
    name: { type: String, unique: true },
    creator: {type: String},
    usersNumber: { type: Number, default: 0 },
    paidUsers: { type: Number }
})

SalaSchema.methods.encryptPassword = async password => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  };
  
  SalaSchema.methods.matchPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

module.exports = mongoose.model('Salas', SalaSchema)