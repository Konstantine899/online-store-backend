'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class CartProduct extends Model {
        static associate() {}
    }

    CartProduct.init(
        {
            quantity: DataTypes.INTEGER,
            cartId: DataTypes.INTEGER,
            productId: DataTypes.INTEGER,
        },
        {
            sequelize,
            modelName: 'cart-product',
        },
    );
    return CartProduct;
};
