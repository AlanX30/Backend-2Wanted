const mongoose = require('mongoose')

const { Schema } = mongoose

const Conected = new Schema({
    userName: {type: String},
    socket: {type: String}
})

module.exports = mongoose.model('Conected', Conected)