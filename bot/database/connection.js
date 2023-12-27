import mongoose from "mongoose"
import env from "../../env/env.js"

mongoose.set('strictQuery', false)

export default mongoose.createConnection(env.DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    //useCreateIndex: true,
    //useFindAndModify: false
})

mongoose.connect(env.DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    //useCreateIndex: true,
    //useFindAndModify: false
})
