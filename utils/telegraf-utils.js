'use strict'

exports.checkIsMentioned = function(ctx, bot) {
    let isMentioned = false
    if (ctx.message.entities && ctx.message.entities.length > 0) {
        for (let i = 0; i < ctx.message.entities.length; i++) {
            const mentionedUsername = ctx.message.text.substr(ctx.message.entities[i].offset, ctx.message.entities[i].length)
            if (mentionedUsername == '@'+bot.username) return true
        }
    }
    return isMentioned
}