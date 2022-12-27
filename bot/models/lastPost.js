import mongoose from 'mongoose'
import connection from "../database/connection.js"

const schema = new mongoose.Schema({
    domain: 'string',
    chat_id: "string",
    bot: 'string',
    post: 'number'
})

const Lastposts = connection.model('lastpost', schema)

export default Lastposts