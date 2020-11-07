const users = require('./routes/users')
const salas = require('./routes/salas')
const treeLogic = require('./routes/treeLogic')
const payments = require('./routes/payments')
const invitations = require('./routes/invitations')

const router = (server) => {
    server.use(users)
    server.use(salas)
    server.use(treeLogic)
    server.use(payments)
    server.use(invitations)
}

module.exports = router