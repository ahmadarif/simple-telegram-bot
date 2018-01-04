'use strict'

exports.getRandomItem = function (array) {
    return array[Math.floor((Math.random() * array.length))]
}