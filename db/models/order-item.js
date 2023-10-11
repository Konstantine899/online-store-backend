'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Item extends Model {
        static associate(models) {
            this.belongsTo(models.order, { as: 'order' });
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
            modelName: 'order-item',
        },
    );
    return Item;
};
