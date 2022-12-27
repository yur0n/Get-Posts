/* 
Creates new client for VK to TG
Accepts object with params:

user.bot = TG bot token
access_token = VK token for API
user.owner_id = VK group id
user.chat_id = TG bot chat id with group or user

*/ 


export default class User {

    constructor(user) {
        this.bot = user.bot
        this.access_token = user.access_token
        this.owner_id = user.owner_id
        this.chat_id = user.chat_id
    }

}