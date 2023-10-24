'use strict';
const { Model } = require('sequelize');
const { CART_PRODUCT, PRODUCT, CART } = require('../consts');
module.exports = (sequelize) => {
    class Cart extends Model {
        static associate(models) {
            this.belongsToMany(models.product, {
                through: `${CART_PRODUCT}`,
                as: `${PRODUCT}`,
                onDelete: 'CASCADE',
            });
        }
    }

    Cart.init(
        {},
        {
            sequelize,
            modelName: `${CART}`,
        },
    );
    return Cart;
};
