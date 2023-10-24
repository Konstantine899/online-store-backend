'use strict';
const { Model } = require('sequelize');
const { USER_ROLE } = require('../consts');
module.exports = (sequelize, DataTypes) => {
    class UserRole extends Model {
        static associate() {}
    }

    UserRole.init(
        {
            roleId: DataTypes.INTEGER,
            userId: DataTypes.INTEGER,
        },
        {
            sequelize,
            modelName: `${USER_ROLE}`,
        },
    );
    return UserRole;
};
