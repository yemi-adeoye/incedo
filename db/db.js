const config = require('config');
const mongoose = require('mongoose')

const connectMongo = () =>{
    const connectionString = config.get('dbString');
    try {
        mongoose.connect(connectionString, () => {
            console.log("mongo connected");
        })
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}

module.exports = { connectMongo };