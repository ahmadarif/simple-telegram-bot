'use strict'

require('dotenv').load();
const Telegraf = require('telegraf')
const { Markup } = require('telegraf')
const axios = require('axios')
const User = require('./db/models').User

const app = new Telegraf('371076129:AAGal_jSzY6xvU7-n8oDh7tSfIxnxgOP4E8')
let state = {}

app.start(async (ctx) => {
    const userId = ctx.from.id
    const username = ctx.message.from.username
    let user = await User.findOne({ where: { userId: userId } })

    if (!user) {
        console.log('baru mulai: ', userId)
        user = await User.create({ userId: userId, name: username })
    } else {
        console.log('member lama: ', userId)
    }

    return ctx.reply(`Assalamu'alaikum @${user.name} 😇`)
})

app.hears('hi', ctx => {
  return ctx.reply('Hey!')
})

app.command('top', async (ctx) => {
    const userId = ctx.message.from.id
    
    const user = await User.findOne({ where: { userId: userId } })
    user.command = 'top'
    await user.save()
    
    return ctx.replyWithMarkdown(`Enter a subreddit name to get *top* posts.`)
})

app.command('hot', async (ctx) => {
    const userId = ctx.message.from.id
    
    const user = await User.findOne({ where: { userId: userId } })
    user.command = 'hot'
    await user.save()

    return ctx.replyWithMarkdown('Enter a subreddit name to get *hot* posts.')
})

app.on('text', async (ctx) => {
    const subreddit = ctx.message.text
    const userId = ctx.message.from.id

    const user = await User.findOne({ where: { userId: userId } })

    const type = user.command != null ? user.command : 'top'

    user.index = 0
    await user.save()

    const data = await axios.get(`https://reddit.com/r/${subreddit}/${type}.json?limit=10`).data
    console.log(data)

        // .then(res => {
        //     console.log('ada nih')
        //     const data = res.data.data
        //     if (data.children.length < 1)
        //         return ctx.reply('The subreddit couldn\'t be found.')

        //     const link = `https://reddit.com/${data.children[0].data.permalink}`
        //     console.log('test')
        //     return ctx.reply(link,
        //         Markup.inlineKeyboard([
        //             Markup.callbackButton('➡️ Next', subreddit)
        //         ]).extra()
        //     )
        // })
        // .catch(err => {
        //     console.log('error nih', err)
        // })
})

app.on('callback_query', ctx => {
    const subreddit = ctx.update.callback_query.data
    const userId = ctx.update.callback_query.from.id
    
    let type
    let index
    try {
        type = state[userId].command ? state[userId].command : 'top'
        index = state[userId].index
    } catch (err) {
        return ctx.reply('Send a subreddit name.')
    }

    ctx.answerCbQuery('Wait...')
    
    axios.get(`https://reddit.com/r/${subreddit}/${type}.json?limit=10`)
        .then(res => {
            const data = res.data.data
            if (!data.children[index + 1]) {
                return ctx.reply('No more posts!')
            }

            const link = `https://reddit.com/${data.children[index + 1].data.permalink}`
            state[userId].index = state[userId].index + 1
            return ctx.reply(link,
                Markup.inlineKeyboard([
                    Markup.callbackButton('➡️ Next', subreddit)
                ]).extra()
            )
        })
        .catch(err => console.log(err))
})

app.startPolling()