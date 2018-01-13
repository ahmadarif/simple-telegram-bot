'use strict'

exports.checkIsMentioned = function(ctx, bot) {
    let isMentioned = false
    if (ctx.message.entities && ctx.message.entities.length > 0) {
        for (let i = 0; i < ctx.message.entities.length; i++) {
            if (ctx.message.entities[i].type != 'mention') continue
            const mentionedUsername = ctx.message.text.substr(ctx.message.entities[i].offset, ctx.message.entities[i].length)
            if (mentionedUsername == '@'+bot.username) return true
        }
    }
    return isMentioned
}

exports.backReply = function (ctx) {
    return Object.assign({ 'reply_to_message_id': ctx.message.message_id })
}