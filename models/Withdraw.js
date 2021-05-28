const mongoose = require('mongoose')

const { Schema } = mongoose

const WithdrawSchema = new Schema({
    user: {type: String, required: true},
    amount: {type: Number, required: true},
    txId: {type: String, required: true},
    toAddress: {type: String},
    toUser: {type: String},
    type: { type: Boolean, default: true },
    date: {type: Date, default: Date.now}
})

module.exports = mongoose.model('Withdraw', WithdrawSchema)