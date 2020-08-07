const mongoose = require('mongoose')

const { Schema } = mongoose

const BalanceUserSchema = new Schema({
    user: {type: String},
    salaName: {type: String},
    salaPrice:{type: Number},
    accumulated: {type: Number},
    won: {type: Number},
    type: {type: String},
    salaPrice: {type: Number},
    depositAmount: {type: Number},
    withdrawAmount: {type: Number},
    wallet: {type: Number},
    date: { type: Date, default: Date.now },
})

module.exports = mongoose.model('BalanceUser', BalanceUserSchema)