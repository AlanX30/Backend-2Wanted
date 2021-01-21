const mongoose = require('mongoose')

const { Schema } = mongoose

const BalanceUserSchema = new Schema({
    user: {type: String},
    salaName: {type: String},
    txId: {type: String},
    salaId: {type: Schema.Types.ObjectId, ref: 'Salas' },
    salaActive: {type: Boolean},
    salaCreator: {type: String},
    salaPrice:{type: Number},
    accumulated: {type: Number},
    fromUser: {type: String},
    toUser: {type: String},
    toAddress: {type: String},
    won: {type: Number},
    type: {type: String},
    salaPrice: {type: Number},
    depositAmount: {type: Number},
    withdrawAmount: {type: Number},
    wallet: {type: Number},
    date: { type: Date, default: Date.now },
})

module.exports = mongoose.model('BalanceUser', BalanceUserSchema)