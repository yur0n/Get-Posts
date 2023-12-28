import axios from "axios"
import { Telegraf, Markup, Scenes } from 'telegraf' //regex for bot token check: /^[0-9]{8,10}:[a-zA-Z0-9_-]{35}$/
import {repliesEN, repliesRU} from "./replies/replies.js" // message replies 
import session from './session/session.js' //my custom telegraf session 
import './botWorker.js' //parsing for each vk goroup to every tg group
import env from '../env/env.js' //environment

// caution advised! ugly code ahead!

const bot = new Telegraf(env.BOT_TOKEN)

bot.use(session('session'));

bot.use((ctx, next) => {  // Save language in the state
  if (ctx.message && ctx.message.from.language_code == 'ru' ) ctx.state.reply = repliesRU
  else ctx.state.reply = repliesEN
  return next()
})
const vkAuthLink = (ctx) => `https://oauth.vk.com/authorize?client_id=${env.VK_APP_ID}&display=mobile&redirect_uri=https://yuron.xyz/api/vkAuth&scope=offline&response_type=code&v=5.131&state=${ctx.from.id}:${ctx.chat.id}`

const botScene = new Scenes.WizardScene(
  'BOTS_SCENE',
  (ctx) => {
    ctx.reply(ctx.state.reply.menu, mainMenu(ctx))
    return ctx.wizard.next();
  },
  (ctx) => {
    if (ctx.message.text == 'Change language' || ctx.message.text == "Поменять язык") {
      if (ctx.state.reply == repliesEN) {
        ctx.state.reply = repliesRU
        ctx.reply(ctx.state.reply.langChange, keyOk)
        return ctx.wizard.selectStep(0)
      } else {
        ctx.state.reply = repliesEN
        ctx.reply(ctx.state.reply.langChange, keyOk)
        return ctx.wizard.selectStep(0)
      }
    }
    if (ctx.message.text == ctx.state.reply.btns.addBot) {
      ctx.wizard.state.action = 'add bot'
      ctx.replyWithHTML(ctx.state.reply.start2 + ctx.state.reply.start3, Markup.keyboard([ctx.state.reply.back]).resize())
      return ctx.wizard.next()
    }
    if (ctx.message.text == ctx.state.reply.btns.vkAuth) {
      ctx.replyWithHTML(ctx.state.reply.authVK2, Markup.inlineKeyboard([
        Markup.button.url(ctx.state.reply.pressAuth, vkAuthLink(ctx))
      ]))
    }
    if ((ctx.message.text == ctx.state.reply.btns.bots || ctx.message.text == ctx.state.reply.back) && ctx.session.access_tokenVK) {
      ctx.reply(ctx.state.reply.botsList, keyboardList(ctx.session.bots.vk, ctx))
      return ctx.wizard.next();
    } else if (ctx.message.text == ctx.state.reply.btns.bots){
      ctx.replyWithHTML(ctx.state.reply.authVK, keyOk)
      return ctx.wizard.back()
    }
  },
  async ctx => {
    if (ctx.message.text == ctx.state.reply.back) {
      ctx.wizard.state.action = ''
      ctx.reply(ctx.state.reply.cancel, keyOk)
      return ctx.wizard.selectStep(0)
    }
    if (ctx.message.text == 'OK') {
      ctx.reply(ctx.state.reply.options, botOptions(ctx))
      return ctx.wizard.next();
    }
    if (ctx.wizard.state.action == 'add bot') {
      ctx.wizard.state.action = ''
      // ctx.telegram.sendChatAction(ctx.message.from.id, 'typing')
      await botAdd(ctx)
      return ctx.wizard.selectStep(0)
    } 
    if (ctx.session.bots.vk.hasOwnProperty(ctx.message.text)) {
      ctx.wizard.state.bot = ctx.message.text || ctx.wizard.state.bot
      ctx.reply(ctx.state.reply.options, botOptions(ctx))
      return ctx.wizard.next();
    }
    ctx.reply(ctx.state.reply.dontWrite, keyOk)
    return ctx.wizard.selectStep(0)
  },
  ctx => {
    if (ctx.message.text == ctx.state.reply.back) {
      ctx.reply(ctx.state.reply.cancel, keyOk)
      return ctx.wizard.selectStep(0)
    }
    if (ctx.message.text == ctx.state.reply.btns.addGroup) {
      if(ctx.session.bots.vk[ctx.wizard.state.bot].channels.length >= 5) {
        ctx.reply(ctx.state.reply.groupLimit, keyOk)
        return ctx.wizard.selectStep(2)
      }
      ctx.wizard.state.action = 'Add group'
      ctx.replyWithHTML(ctx.state.reply.groups, Markup.keyboard([ctx.state.reply.back]).resize())
      return ctx.wizard.next();
    }
    if (ctx.message.text == ctx.state.reply.btns.addChannel) {
      if(ctx.session.bots.vk[ctx.wizard.state.bot].channelsTo.length >= 5) {
        ctx.reply(ctx.state.reply.groupLimit, keyOk)
        return ctx.wizard.selectStep(2)
      }
      ctx.wizard.state.action = 'Add channel'
      ctx.replyWithHTML(ctx.state.reply.channels, Markup.keyboard([ctx.state.reply.back]).resize())
      return ctx.wizard.next();
    }
    if (ctx.message.text == ctx.state.reply.btns.listGet) {
      ctx.reply(ctx.state.reply.groupsList, keyboardList(ctx.session.bots.vk[ctx.wizard.state.bot].channels, ctx))
      ctx.wizard.state.action = 'Delete group'
      return ctx.wizard.next();
    }
    if (ctx.message.text == ctx.state.reply.btns.listSend) {
      ctx.reply(ctx.state.reply.channelsList, keyboardList(ctx.session.bots.vk[ctx.wizard.state.bot].channelsTo, ctx))
      ctx.wizard.state.action = 'Delete channel'
      return ctx.wizard.next();
    }
    if (ctx.message.text == ctx.state.reply.btns.dltBot) {
      ctx.wizard.state.action = 'Delete bot'
      ctx.reply(ctx.state.reply.botDel, Markup.keyboard([[ctx.state.reply.back, ctx.state.reply.delete]]).resize())
      return ctx.wizard.next();
    }
  },
  ctx => {
    if (ctx.message.text == ctx.state.reply.back) {
      ctx.reply(ctx.state.reply.cancel, keyOk)
      return ctx.wizard.selectStep(2)
    }
    if (ctx.wizard.state.action == 'Delete group') {
      ctx.wizard.state.action = ''
      let index = ctx.session.bots.vk[ctx.wizard.state.bot].channels.indexOf(ctx.message.text)
      ctx.session.bots.vk[ctx.wizard.state.bot].channels.splice(index, 1)
      ctx.reply(ctx.state.reply.groupDel, keyOk)
      return ctx.wizard.selectStep(2)
    }
    if (ctx.wizard.state.action == 'Delete channel') {
      ctx.wizard.state.action = ''
      let index = ctx.session.bots.vk[ctx.wizard.state.bot].channelsTo.indexOf(ctx.message.text)
      ctx.session.bots.vk[ctx.wizard.state.bot].channelsTo.splice(index, 1)
      ctx.reply(ctx.state.reply.groupDel, keyOk)
      return ctx.wizard.selectStep(2)
    }
    if (ctx.wizard.state.action == 'Add group') {
      ctx.wizard.state.action = ''
      let channel = ctx.message.text.slice(15)
      if (!(new RegExp(/[a-zA-Z]+:\/\/[a-zA-Z]+\.[a-zA-Z]+\/[A-Za-z0-9]+/).test(ctx.message.text))) {
        ctx.reply(ctx.state.reply.wrongGroup, keyOk)
        return ctx.wizard.selectStep(2)
      } else if (ctx.session.bots.vk[ctx.wizard.state.bot].channels.includes(channel)) {
        ctx.reply(ctx.state.reply.alreadyGroup, keyOk)
        return ctx.wizard.selectStep(2)
      }
      ctx.session.bots.vk[ctx.wizard.state.bot].channels.push(channel)
      ctx.reply(ctx.state.reply.groupAdd, keyOk)
      return ctx.wizard.selectStep(2)
    }

    if (ctx.wizard.state.action == 'Add channel') {
      ctx.wizard.state.action = ''
      let channel = "@" + ctx.message.text.slice(13) 
      if (!(new RegExp(/[a-zA-Z]+:\/\/[a-zA-Z]+\.[a-zA-Z]+\/[A-Za-z0-9]+/).test(ctx.message.text))) {
        ctx.reply(ctx.state.reply.wrongGroup, keyOk)
        return ctx.wizard.selectStep(2)
      } else if (ctx.session.bots.vk[ctx.wizard.state.bot].channelsTo.includes(channel)) {
        ctx.reply(ctx.state.reply.alreadyChannel, keyOk)
        return ctx.wizard.selectStep(2)
      }
      ctx.session.bots.vk[ctx.wizard.state.bot].channelsTo.push(channel)
      ctx.reply(ctx.state.reply.channelAdd, keyOk)
      return ctx.wizard.selectStep(2)
    }

    if (ctx.wizard.state.action = 'Delete bot') {
      ctx.wizard.state.action = ''
      delete ctx.session.bots.vk[ctx.wizard.state.bot]
      ctx.reply(ctx.state.reply.botDeleted, keyOk)
      return ctx.wizard.selectStep(0)
    }
  },
  async ctx => {

  },

)

const stage = new Scenes.Stage([botScene])
bot.use(stage.middleware())


async function botAdd (ctx) {
  ctx.session.bots = ctx.session.bots || {}
  ctx.session.bots.vk = ctx.session.bots.vk || {}

  if (!(new RegExp(/^[0-9]{8,10}:[a-zA-Z0-9_-]{35}$/).test(ctx.message.text))) {
    ctx.reply(ctx.state.reply.wrongToken, keyOk)
    return
  }

  if (Object.keys(ctx.session.bots.vk).length >= 4) {
    ctx.reply(ctx.state.reply.botLimit, keyOk)
    return
  }

  for (let bot in ctx.session.bots.vk) {
    if (ctx.session.bots.vk[bot].token == ctx.message.text) {
      ctx.reply(ctx.state.reply.alreadyBot, keyOk)
      return
    }
  }
 
  await axios.get(`https://api.telegram.org/bot${ctx.message.text}/getMe`)
  .then((res) => {
    return res.data.result
  })
  .then((data) => {
    ctx.session.bots.vk[data.username] = {name: data.first_name || data.username, token: ctx.message.text, channels: [], channelsTo: []}
    ctx.reply(ctx.state.reply.botAdd, keyOk)
  })
  .catch((e) => {
    ctx.reply(ctx.state.reply.wrongToken, keyOk)
    console.log("Bot add failed:", e.response.data || e)
  })
}


//keyboards
function mainMenu(ctx) {
  return Markup.keyboard([
    [ ctx.state.reply.btns.bots, ctx.state.reply.btns.addBot ],
    [ ctx.state.reply.btns.vkAuth, ctx.state.reply.btns.lang ]
  ]).resize()
}

const keyOk = Markup.keyboard(['OK']).resize()

function botOptions(ctx) {
  return Markup.keyboard([
    [ ctx.state.reply.btns.addGroup, ctx.state.reply.btns.addChannel ],
    [ ctx.state.reply.btns.listGet, ctx.state.reply.btns.listSend ],
    [ ctx.state.reply.btns.dltBot ],
    [ctx.state.reply.back]
  ])
}

function keyboardList(value, ctx) {
  let arr = []
  let arr2 = []
  let i = 0
  if (!Array.isArray(value)) value = Object.keys(value) // check if you want to list bots because bots is object and channels is array
  value.forEach(el => {
    if (i % 2) {
      arr2.push(el)
      arr.push(arr2)
      arr2 = []
      i++
      return
    }
    arr2.push(el)
    i++
    })
  arr.push(arr2, [ctx.state.reply.back])
  return Markup.keyboard(arr).resize()  
}
  
// function botsKey (bots) {
//   let arr = []
//   let arr2 = []
//   for (let bot in bots) {
//     arr.push(Markup.button.callback(bot, bot))
//   }
//   // arr.push(arr2)
//   return Markup.keyboard(arr)
// }

//commands
stage.command('restart', ctx => {
  ctx.scene.leave('BOTS_SCENE')
})

bot.command('start', async ctx => {
  await ctx.reply(ctx.state.reply.start)
  await ctx.replyWithHTML(ctx.state.reply.start2)
  // ctx.scene.enter('BOTS_SCENE')
})



//hears
bot.hears(/^[0-9]{8,10}:[a-zA-Z0-9_-]{35}$/, async (ctx) =>{
  console.log(ctx.from.id)
  ctx.session.bots = ctx.session.bots || {}
  ctx.session.bots.vk = ctx.session.bots.vk || {}
  // ctx.session.access_tokenVK = ctx.session.access_tokenVK || ''

  for (let bot in ctx.session.bots.vk) {
    if (ctx.session.bots.vk[bot].token == ctx.match[0]) return ctx.reply(ctx.state.reply.alreadyBot)
  }
  if (Object.keys(ctx.session.bots.vk).length >= 4) return ctx.reply(ctx.state.reply.botLimit)
  await axios.get(`https://api.telegram.org/bot${ctx.match[0]}/getMe`)
  .then((res) => {
    return res.data.result
  })
  .then((data) => {
    ctx.session.bots.vk[data.username] = {name: data.first_name, token: ctx.match[0], channels: [], channelsTo: []}
    ctx.reply(ctx.state.reply.botAdd, keyOk)
    ctx.scene.enter('BOTS_SCENE')
  })
  .catch((e) => {
    ctx.reply(ctx.state.reply.wrongToken)
    console.log("Bot add failed:", e.response.data || e)
  })
})

bot.catch((err, ctx) => {
  console.log(err)
  ctx.reply(ctx.state.reply.wrong)
  console.log(`Error for ${ctx.updateType} \nDetails:`)
})

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));


process.on('uncaughtException', (err, origin) => {
    console.log(`Caught exception: ${err}\n` + `Exception origin: ${origin}`)
});