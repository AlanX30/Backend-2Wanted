const users = require('./routes/users')
const salas = require('./routes/salas')
const inSala = require('./routes/inSala')

const router = (server) => {
    server.use(users)
    server.use(salas)
    server.use(inSala)
}

module.exports = router