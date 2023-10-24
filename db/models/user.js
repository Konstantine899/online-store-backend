'use strict';
const { Model } = require('sequelize');
const {
    REFRESH_TOKEN,
    ORDER,
    USER_ROLE,
    ROLE,
    RATING,
    PRODUCT,
    USER,
} = require('../consts');
module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            this.hasMany(models.refreshToken, {
                as: `${REFRESH_TOKEN}`,
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            });
            this.hasMany(models.order, {
                as: `${ORDER}`,
                onDelete: 'SET NULL',
            });
            this.belongsToMany(models.role, {
                through: `${USER_ROLE}`,
                as: `${ROLE}`,
            });
            this.belongsToMany(models.product, {
                through: `${RATING}`,
                as: `${PRODUCT}`,
                onDelete: 'CASCADE',
            });
        }
    }

    User.init(
        {
            email: DataTypes.STRING,
            password: DataTypes.STRING,
        },
        {
            sequelize,
            modelName: `${USER}`,
        },
    );
    return User;
};
