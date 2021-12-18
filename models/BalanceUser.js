const mongoose = require('mongoose')

const { Schema } = mongoose

const BalanceUserSchema = new Schema({
    user: {type: String},
    salaName: {type: String},
    txId: {type: String},
    salaId: {type: Schema.Types.ObjectId, ref: 'Salas' },
    salaActive: {type: Boolean},
    depositBtc: {type: Boolean},
    withdraw: {type: Boolean},
    withdrawId: {type: String},
    salaCreator: {type: String},
    salaPrice:{type: Number},
    totalAmount: {type: Number},
    fee:{type: Number},
    salaRepeat:{type: Number},
    accumulated: {type: Number},
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