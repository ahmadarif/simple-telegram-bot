'use strict'

require('dotenv').load();
const Telegraf = require('telegraf')
const { Markup } = require('telegraf')
const axios = require('axios')
const User = require('./db/models').User

const app = new Telegraf(process.env.TELEGRAM_TOKEN)

app.start(async (ctx) => {
    try {
        const userId = ctx.from.id
        const username = ctx.message.from.username
        let user = await User.findOne({ where: { userId: userId } })

        if (!user) {
            user = await User.create({ userId: userId, name: username })
        }

        return ctx.reply(`Assalamu'alaikum @${user.name} 😇`)
    } catch (e) {
        console.log('Terjadi kesalahan di "start()".', e)
        return ctx.reply('Hampura error euy 🙇')
    }
})

app.hears('hi', ctx => {
  return ctx.reply('Hey!')
})

app.command('top', async (ctx) => {
    try {
        const userId = ctx.message.from.id
        
        const user = await User.findOne({ where: { userId: userId } })
        user.command = 'top'
        await user.save()
        
        return ctx.replyWithMarkdown(`Enter a subreddit name to get *top* posts.`)
    } catch (e) {
        console.log('Terjadi kesalahan di "command /top".', e)
        return ctx.reply('Hampura error euy 🙇')
    }
})

app.command('hot', async (ctx) => {
    try {
        const userId = ctx.message.from.id
    
        const user = await User.findOne({ where: { userId: userId } })
        user.command = 'hot'
        await user.save()

        return ctx.replyWithMarkdown('Enter a subreddit name to get *hot* posts.')
    } catch (e) {
        console.log('Terjadi kesalahan di "command /hot".', e)
        return ctx.reply('Hampura error euy 🙇')
    }
})

app.on('text', async (ctx) => {
    try {
        const subreddit = ctx.message.text
        const userId = ctx.message.from.id

        const user = await User.findOne({ where: { userId: userId } })
        const type = user.command != null ? user.command : 'top'

        await user.update({ index: 0 })

        const res = await axios.get(`https://reddit.com/r/${subreddit}/${type}.json?limit=10`, { timeout: 5000 })
        const data = res.data.data

        if (data.children.length < 1) {
            return ctx.reply('The subreddit couldn\'t be found.')
        }

        const link = `https://reddit.com/${data.children[0].data.permalink}`
        return ctx.reply(link,
            Markup.inlineKeyboard([
                Markup.callbackButton('➡️ Next', subreddit)
            ]).extra()
        )
    } catch (e) {
        console.log('Terjadi kesalahan di "on text".', e)
        return ctx.reply('Hampura error euy 🙇')
    }
})

app.on('callback_query', async (ctx) => {
    try {
        const subreddit = ctx.update.callback_query.data
        const userId = ctx.update.callback_query.from.id
        const user = await User.findOne({ where: { userId: userId } })

        const type = user.command != null ? user.command : 'top'
        const index = user.index

        ctx.answerCbQuery('Wait...')

        const res = await axios.get(`https://reddit.com/r/${subreddit}/${type}.json?limit=10`, { timeout: 5000 })
        const data = res.data.data

        if (!data.children[index + 1]) {
            return ctx.reply('No more posts!')
        }

        await user.update({ index: user.index + 1 })
        
        const link = `https://reddit.com/${data.children[index + 1].data.permalink}`
        return ctx.reply(link,
            Markup.inlineKeyboard([
                Markup.callbackButton('➡️ Next', subreddit)
            ]).extra()
        )
    } catch (e) {
        console.log('Terjadi kesalahan di "on callback_query".', e)
        return ctx.reply('Hampura error euy 🙇')
    }
})

app.startPolling()