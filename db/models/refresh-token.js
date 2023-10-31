'use strict';
const {Model} = require('sequelize');
const {USER, REFRESH_TOKEN} = require('../consts');
// eslint-disable-next-line prettier/prettier
module.exports = (sequelize, DataTypes): void => {
    class RefreshToken extends Model {
        static associate(models): void {
            this.belongsTo(models.user, {as: `${USER}`});
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
