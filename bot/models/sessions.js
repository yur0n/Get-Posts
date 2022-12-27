import mongoose from "mongoose"
import connection from "../database/connection.js"

const schema = new mongoose.Schema({
    key: 'string',
    data: {},
})

const Session = connection.model('Session', schema)

export default Session


    // user = new User({
    //   bot: ctx.message.text,
    //   access_token: access_token,
    //   owner_id: 0,
    //   chat_id: ctx.message.chat.id,
    // })