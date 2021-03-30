const users = require('./routes/users')
const salas = require('./routes/salas')
const treeLogic = require('./routes/treeLogic')
const payments = require('./routes/payments')
const balanceGeneral = require('./routes/balanceGeneral')
const admin = require('./routes/admin')
const invitations = require('./routes/invitations')

const router = (server) => {
    server.use(users)
    server.use(salas)
    server.use(treeLogic)
    server.use(admin)
    server.use(payments)
    server.use(invitations)
    server.use(balanceGeneral)
}

module.exports = router