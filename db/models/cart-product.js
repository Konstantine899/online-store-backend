'use strict';
const {Model} = require('sequelize');
const {CART_PRODUCT} = require('../consts');
// eslint-disable-next-line prettier/prettier
module.exports = (sequelize, DataTypes): void => {
    class CartProduct extends Model {
        static associate(): void {
        }
    }

    CartProduct.init(
        {
            quantity: DataTypes.INTEGER,
            cartId: DataTypes.INTEGER,
            productId: DataTypes.INTEGER,
        },
        {
            sequelize,
            modelName: `${CART_PRODUCT}`,
            underscored: true,
        },
    );
    return CartProduct;
};
