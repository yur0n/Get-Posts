import mongoose from "mongoose"

mongoose.set('strictQuery', false)

export default mongoose.connect('mongodb+srv://yur0n:786512@cluster0.0na8y.mongodb.net/telegram?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // dbName: 'telegram',
    // useCreateIndex: true,
    // useFindAndModify: false
})