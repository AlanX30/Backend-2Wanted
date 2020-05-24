const mongoose = require('mongoose')

const URI = "mongodb+srv://AlanX30:A31232723s@piramide-fxv0x.mongodb.net/test?retryWrites=true&w=majority"

mongoose.connect(URI, {
    useCreateIndex: true,
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false
})
.then(() => console.log('DB is connected'))
.catch(err => console.log(`Hubo un error ${err}`))

