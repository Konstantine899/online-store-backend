'use strict';
const {Model} = require('sequelize');
const {USER_ROLE} = require('../consts');
// eslint-disable-next-line prettier/prettier
module.exports = (sequelize, DataTypes): void => {
    class UserRole extends Model {
        static associate(): void {
        }
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
