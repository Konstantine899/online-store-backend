'use strict';
const { Model } = require('sequelize');
const { USER_ROLE, USER, ROLE } = require('../consts');
// eslint-disable-next-line prettier/prettier
module.exports = (sequelize, DataTypes) => {
    class role extends Model {
        static associate(models) {
            this.belongsToMany(models.user, {
                through: `${USER_ROLE}`,
                as: `${USER}`,
            });
        }
    }

    role.init(
        {
            role: DataTypes.STRING,
            description: DataTypes.STRING,
        },
        {
            sequelize,
            modelName: `${ROLE}`,
        },
    );
    return role;
};
