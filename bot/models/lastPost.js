import mongoose from 'mongoose'

const conn = mongoose.createConnection('mongodb+srv://yur0n:786512@cluster0.0na8y.mongodb.net/telegram?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    // useCreateIndex: true,
    // useFindAndModify: false
})

const schema = new mongoose.Schema({
    domain: 'string',
    chat_id: "string",
    bot: 'string',
    post: 'number'
})

const Lastposts = conn.model('lastpost', schema)

export default Lastposts