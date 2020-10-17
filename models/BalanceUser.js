const mongoose = require('mongoose')

const { Schema } = mongoose

const BalanceUserSchema = new Schema({
    user: {type: String},
    salaName: {type: String},
    salaId: {type: Schema.Types.ObjectId, ref: 'Salas' },
    salaActive: {type: Boolean},
    salaCreator: {type: String},
    salaPrice:{type: Number},
    accumulated: {type: Number},
    won: {type: Number},
    type: {type: String},
    state: {type: String},
    salaPrice: {type: Number},
    depositAmount: {type: Number},
    withdrawAmount: {type: Number},
    wallet: {type: Number},
    date: { type: Date, default: Date.now },
})

module.exports = mongoose.model('BalanceUser', BalanceUserSchema)