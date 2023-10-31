'use strict';
const { Model } = require('sequelize');
const { USER, REFRESH_TOKEN } = require('../consts');
module.exports = (sequelize, DataTypes) => {
    class RefreshToken extends Model {
        static associate(models) {
            this.belongsTo(models.user, { as: `${USER}` });
        }
    }

    RefreshToken.init(
        {
            is_revoked: DataTypes.BOOLEAN,
            expires: DataTypes.DATE,
        },
        {
            sequelize,
            modelName: `${REFRESH_TOKEN}`,
        },
    );
    return RefreshToken;
};
