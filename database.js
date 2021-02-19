const mongoose = require('mongoose')

const URI = process.env.DB_URI

mongoose.connect(URI, {
    useCreateIndex: true,
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false
})
.then(() => console.log('DB is connected'))
.catch(err => console.log(`Error: ${err}`))

