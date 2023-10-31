'use strict';
const { Model } = require('sequelize');
const { ORDER, ORDER_ITEM } = require('../consts');
// eslint-disable-next-line prettier/prettier
module.exports = (sequelize, DataTypes) => {
    class Item extends Model {
        static associate(models) {
            this.belongsTo(models.order, { as: `${ORDER}` });
        }
    }

    Item.init(
        {
            name: DataTypes.STRING,
            price: DataTypes.FLOAT,
            quantity: DataTypes.INTEGER,
            orderId: DataTypes.INTEGER,
        },
        {
            sequelize,
            modelName: `${ORDER_ITEM}`,
            underscored: true,
        },
    );
    return Item;
};
