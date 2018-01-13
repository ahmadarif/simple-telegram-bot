'use strict'

require('dotenv').load()

const Telegraf = require('telegraf')
const Markup = require('telegraf/markup')
const Extra = require('telegraf/extra')
const rateLimit = require('telegraf-ratelimit')
const commandParts = require('telegraf-command-parts')
const axios = require('axios')
const UserService = require('./services/UserService')
const { checkIsMentioned } = require('./utils/telegraf-utils')
const { getRandomItem } = require('./utils/utils')

const app = new Telegraf(process.env.TELEGRAM_TOKEN)
let bot

// Set limit to 1 message per 3 seconds
// app.use(rateLimit({
//     window: 3000,
//     limit: 1,
//     onLimitExceeded: (ctx, next) => ctx.reply('Santai bro/sist, pelan-pelan ai kamu 😓')
// }))

app.use(commandParts())

app.use(Telegraf.log())

app.use(async (ctx, next) => {
    const bot = await ctx.telegram.getMe()
    ctx.isMentioned = checkIsMentioned(ctx, bot)
    ctx.chatType = ctx.message.chat.type
    return next()
})

app.telegram.getMe().then((appInfo) => {
    app.options.username = appInfo.username
    bot = appInfo
})

app.start(async (ctx) => {
    try {
        const userId = ctx.from.id
        const username = ctx.from.username

        const user = await UserService.findOrCreate(userId, username)

        return ctx.reply(`Assalamu'alaikum @${user.name} 😇`)
    } catch (e) {
        console.log('Terjadi kesalahan di "start()".', e)
        return ctx.reply('Hampura error euy 🙇')
    }
})

app.hears(/^(hi|hello|hai|halo|(.\w+ (hi|hello|hai|halo)))/i, async (ctx) => {
    if (ctx.chatType == 'private' || ctx.isMentioned) {
        const sapaan = ["hi", "hello", "hai", "halo"]
        return ctx.reply(`${getRandomItem(sapaan)} @${ctx.from.username} 🙋‍♂️`)
    } else {
        console.log('terpanggil')
    }
})

app.command('top', async (ctx) => {
    try {
        const userId = ctx.from.id
        const username = ctx.from.username

        const user = await UserService.findOrCreate(userId, username)
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
        const userId = ctx.from.id
        const username = ctx.from.username

        const user = await UserService.findOrCreate(userId, username)
        user.command = 'hot'
        await user.save()

        return ctx.replyWithMarkdown('Enter a subreddit name to get *hot* posts.')
    } catch (e) {
        console.log('Terjadi kesalahan di "command /hot".', e)
        return ctx.reply('Hampura error euy 🙇')
    }
})

// app.hears('onetime', ({ reply }) =>
//   reply('One time keyboard', Markup
//     .keyboard(['/simple', '/inline', '/pyramid'])
//     .oneTime()
//     .resize()
//     .extra()
//   )
// )

// app.hears('custom', ({ reply }) => {
//     return reply('Custom buttons keyboard', Markup
//         .keyboard([
//             ['🔍 Search', '😎 Popular'], // Row1 with 2 buttons
//             ['☸ Setting', '📞 Feedback'], // Row2 with 2 buttons
//             ['📢 Ads', '⭐️ Rate us', '👥 Share'] // Row3 with 3 buttons
//         ])
//         //   .oneTime()
//         // .resize()
//         .extra()
//     )
// })

// app.hears('🔍 Search', ctx => ctx.reply('Yay!'))
// app.hears('📢 Ads', ctx => ctx.reply('Free hugs. Call now!'))

// app.hears('special', (ctx) => {
//     return ctx.reply('Special buttons keyboard', Extra.markup((markup) => {
//         return markup
//             .keyboard([
//                 markup.contactRequestButton('Send contact'),
//                 markup.locationRequestButton('Send location')
//             ])
//             .resize()
//       }))
// })
  
// app.hears('inline', (ctx) => {
//     return ctx.replyWithHTML('<b>Coke</b> or <i>Pepsi?</i>',
//         Markup.inlineKeyboard([
//             Markup.callbackButton('Coke', 'Coke'),
//             Markup.callbackButton('Pepsi', 'Pepsi')
//         ]).extra()
//     )
// })

// app.on('message', ({ reply, message, update }) => {
//     reply(message.text, Extra.markup(
//         Markup.inlineKeyboard([
//             Markup.urlButton('❤️', 'http://telegraf.js.org'),
//             Markup.callbackButton('Delete', 'delete')
//         ])
//     ))
//     if (update.message.chat.type == 'private') {
//         console.log('private chat')
//     } else {
//         console.log('group OR supergroup chat')
//     }
// })
// app.action('delete', ({ deleteMessage, update }) => {
//     console.log('action delete =', update.callback_query.data)
//     deleteMessage()
// })

app.on('text', async (ctx) => {
    if (ctx.update.message.chat.type == 'private') { // personal chat
        try {
            const subreddit = ctx.message.text
            const userId = ctx.from.id
            const username = ctx.from.username

            const user = await UserService.findOrCreate(userId, username)
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
    } else {
        console.log('isMentioned = ', ctx.isMentioned)
    }
})

app.on('callback_query', async (ctx) => {
    try {
        const subreddit = ctx.update.callback_query.data
        const userId = ctx.update.callback_query.from.id
        const username = ctx.from.username

        const user = await UserService.findOrCreate(userId, username)
        
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

app.on('new_chat_members', async (ctx) => {
    const message = ctx.update.message
    const newMember = message.new_chat_participant // id, is_app, first_name, last_name, username
    const user = await UserService.findOrCreate(newMember.id, newMember.username)
    if (newMember.username)
        return ctx.reply(`Sampurasun @${newMember.username} 🙋‍♂️`)
    else
        return ctx.replyWithMarkdown(`Sampurasun *${newMember.first_name + " " + newMember.last_name}* 🙋`)
})

app.startPolling()