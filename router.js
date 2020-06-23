const users = require('./routes/users')
const salas = require('./routes/salas')
const inSala = require('./routes/inSala')
const invitations = require('./routes/invitations')

const router = (server) => {
    server.use(users)
    server.use(salas)
    server.use(inSala)
    server.use(invitations)
}

module.exports = router