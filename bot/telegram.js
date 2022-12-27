const bot = require('./bot')

module.exports = telegramWebHook = (req, res) => {
    if (!req.body) return res.status(406).send('Not Acceptable')
    bot(req.body) 
    res.send('ok')
}