'use strict';
const {Model} = require('sequelize');
const {CART_PRODUCT, PRODUCT, CART} = require('../consts');
// eslint-disable-next-line prettier/prettier
module.exports = (sequelize): void => {
    class Cart extends Model {
        static associate(models): void {
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
