import mongoose from "mongoose"
import "../database/connection.js"

const schema = new mongoose.Schema({
    key: 'string',
    data: {},
})

export default mongoose.model('Session', schema)


    // user = new User({
    //   bot: ctx.message.text,
    //   access_token: access_token,
    //   owner_id: 0,
    //   chat_id: ctx.message.chat.id,
    // })
