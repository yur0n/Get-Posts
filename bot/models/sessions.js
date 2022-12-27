import mongoose from "mongoose"

const conn = mongoose.createConnection('mongodb+srv://yur0n:786512@cluster0.0na8y.mongodb.net/telegram?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    // useCreateIndex: true,
    // useFindAndModify: false
})

const schema = new mongoose.Schema({
    key: 'string',
    data: {},
})

const Session = conn.model('Session', schema)

export default Session


    // user = new User({
    //   bot: ctx.message.text,
    //   access_token: access_token,
    //   owner_id: 0,
    //   chat_id: ctx.message.chat.id,
    // })