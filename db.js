// requirements and configs:
const mongodb = require('mongodb')
const dotenv = require('dotenv')
dotenv.config()

// Connecting the data base
mongodb.connect(process.env.CONNECTIONSTRING, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, client){
    module.exports = client
    const notebook = require('./notebook')
    notebook.listen(process.env.PORT)
})