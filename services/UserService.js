'use strict'

const User = require('../db/models').User

class UserService {
    
    /**
     * Find user or create a new one
     * @param {String} userId
     * @param {String} username
     * @returns user object
     */
    async findOrCreate(userId, username) {
        let user = await User.findOne({ where: { userId: userId } })
        if (!user) {
            user = await User.create({ userId: userId, name: username })
        }
        return user
    }

}

module.exports = new UserService