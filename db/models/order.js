'use strict';
const {Model} = require('sequelize');
const {USER, ORDER_ITEM, ORDER} = require('../consts');
// eslint-disable-next-line prettier/prettier
module.exports = (sequelize, DataTypes): void => {
    class order extends Model {
        static associate(models): void {
            this.belongsTo(models.user, {as: `${USER}`});
            this.hasMany(models.item, {
                as: `${ORDER_ITEM}`,
                onDelete: 'CASCADE',
            });
        }
    }

    order.init(
        {
            name: DataTypes.STRING,
            email: DataTypes.STRING,
            phone: DataTypes.STRING,
            address: DataTypes.STRING,
            amount: DataTypes.FLOAT,
            status: DataTypes.INTEGER,
            comment: DataTypes.STRING(2200),
            user_id: DataTypes.INTEGER,
        },
        {
            sequelize,
            modelName: `${ORDER}`,
            underscored: true,
        },
    );
    return order;
};
