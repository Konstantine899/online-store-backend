'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class RefreshToken extends Model {
        static associate(models) {
            this.belongsTo(models.user, { as: 'user' });
        }
    }

    RefreshToken.init(
        {
            is_revoked: DataTypes.BOOLEAN,
            expires: DataTypes.DATE,
        },
        {
            sequelize,
            modelName: 'refresh-token',
        },
    );
    return RefreshToken;
};
