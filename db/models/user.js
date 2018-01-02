'use strict';
module.exports = (sequelize, DataTypes) => {
  var User = sequelize.define('User', {
    userId: DataTypes.STRING,
    name: DataTypes.STRING,
    command: DataTypes.STRING,
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });
  return User;
};