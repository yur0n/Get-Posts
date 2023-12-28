import mongoose from 'mongoose'
import "../database/connection.js"

const schema = new mongoose.Schema({
    domain: 'string',
    chat_id: "string",
    bot: 'string',
    post: 'number'
})

export default mongoose.model('lastpost', schema)
