const mongoose = require('mongoose')

const { Schema } = mongoose

const InvitationsSchema = new Schema({
    user: {type: String },
    host: {type: String },
    parentUsername: {type: String },
    message: {type: String },
    price: {type: Number },
    salaId: {type: Schema.Types.ObjectId, ref: 'Salas' },
    salaName: {type: String },
    read: {type: Boolean, default: false}
})

module.exports = mongoose.model('Invitations', InvitationsSchema)