const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const { Schema } = mongoose

const SalaSchema = new Schema({
    users: [
        { 
           user: {type: Schema.Types.ObjectId, ref: 'Users'},
           childsId: {
               childId1: {type: Schema.Types.ObjectId, ref: 'Users'},
               childId2: {type: Schema.Types.ObjectId, ref: 'Users'}
           },
           parentId: {type: Schema.Types.ObjectId, ref: 'Users'}
        }
    ],
    price: { type: Number },
    name: { type: String, unique: true },
    password: {type: String},
    creator: {type: String},
    protected: {type: Boolean, default:false}
})

SalaSchema.methods.encryptPassword = async password => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  };
  
  SalaSchema.methods.matchPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

module.exports = mongoose.model('Salas', SalaSchema)