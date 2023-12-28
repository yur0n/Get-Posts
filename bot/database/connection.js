import mongoose from "mongoose"
import env from "../../env/env.js"

mongoose.set('strictQuery', false)

mongoose.connect(env.DB_CONNECTION)