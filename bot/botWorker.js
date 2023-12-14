import axios from 'axios'
import Sessions from './models/sessions.js'
import Lastpost from './models/lastPost.js'

async function parserVK(domain, bot, access_token, chat_id) {
    axios.get("https://api.vk.com/method/wall.get", {
        params: {
            domain,
            access_token,
            count: 2,
            v: 5.131,
        }
    })
    .then(res => {
        let itemPosted = false
        res.data.response.items.forEach( async item => {
            if (itemPosted || item.is_pinned || item.marked_as_ads) return

            itemPosted = true
            
            let lastDomain = await Lastpost.findOne({domain, chat_id, bot})

            if (!lastDomain) {
                lastDomain = new Lastpost({
                    domain,
                    chat_id,
                    bot,
                    post: 0
                })
                await lastDomain.save().catch(console.log)
            } else if (item.id <= lastDomain.post) return

                lastDomain.post = item.id
                await lastDomain.save().catch(console.log)

                let caption = item.text || item.copy_history[0].attachments[0].photo.text || 'Photo'
                if (caption.match(/\[[a-z]+[0-9]+\|.*\]/i)) {               // Check for link in text [club2131|<<people.com>>]
                    let regCheck = caption.match(/\[[a-z]+[0-9]+\|.*\]/i)
                    caption = caption.replace(regCheck, '')
                }

                let photos = []
                let photoWidth = 0
                let photo = ''

                if (caption.length > 1024) {
                    axios.post(`https://api.telegram.org/bot${bot}/sendMessage`, {chat_id, text: caption})
                    .catch((e) => console.log(e.response.data))
                    return
                }
                if (item.attachments[0]) {

                    // if (item.copy_history[0].attachments[0].photo) photos = item.copy_history[0].attachments[0].photo.sizes 
                    if (item.attachments[0].photo) photos = item.attachments[0].photo.sizes || []
                    else if (item.attachments[0].video) photos = item.attachments[0].video.image || []
                    else if (item.attachments[0].audio) photos = item.attachments[1].photo.sizes || []
                    else if (item.attachments[0].link) photos = item.attachments[0].link.photo.sizes || []
                    photos.forEach(el => {
                        if (el.width > photoWidth) {
                            photoWidth = el.width
                            photo = el.url
                        }
                    })
                    axios.post(`https://api.telegram.org/bot${bot}/sendPhoto`, {chat_id, photo, caption})
                    .catch((e) => console.log(e.response.data))
                    return
                }

                axios.post(`https://api.telegram.org/bot${bot}/sendMessage`, {chat_id, text: caption})
                        .catch((e) => console.log(e.response.data))      

        });
    })
    .catch((e) => console.log(e))   
}











async function work() {
    let users = await Sessions.find()
    if (!users) return
    users.forEach(user => {
        if (!user.data.bots || !user.data.access_tokenVK) return
        let access_tokenVK = user.data.access_tokenVK
        let botsVK = user.data.bots.vk
        for (let bot in botsVK) {
            let botToken = botsVK[bot].token
            // if (botsVK[bot].channels.length == 0 || botsVK[bot].channelsTo.length == 0) return
            botsVK[bot].channels.forEach( async channelVK => {
                botsVK[bot].channelsTo.forEach( async channelTG => {
                    await parserVK(channelVK, botToken, access_tokenVK, channelTG)
                })
            })
        }
    })
}




setInterval(work, 600000)
