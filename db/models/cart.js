'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize) => {
    class Cart extends Model {
        static associate(models) {
            this.belongsToMany(models.product, {
                through: 'cart-product',
                as: 'products',
                onDelete: 'CASCADE',
            });
        }
    }

    Cart.init(
        {},
        {
            sequelize,
            modelName: 'Cart',
        },
    );
    return Cart;
};
