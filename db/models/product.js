'use strict';
const { Model } = require('sequelize');
const {
    BRAND,
    CATEGORY,
    PRODUCT_PROPERTY,
    RATING,
    USER,
    CART_PRODUCT,
    CART,
    PRODUCT,
} = require('../consts');
module.exports = (sequelize, DataTypes) => {
    class product extends Model {
        static associate(models) {
            models.cart = undefined;
            this.belongsTo(models.brand, { as: `${BRAND}` });
            this.belongsTo(models.category, { as: `${CATEGORY}` });
            this.hasMany(models.property, {
                as: `${PRODUCT_PROPERTY}`,
                onDelete: 'CASCADE',
            });
            this.belongsToMany(models.user, {
                through: `${RATING}`,
                as: `${USER}`,
                onDelete: 'CASCADE',
            });
            this.belongsToMany(models.cart, {
                through: `${CART_PRODUCT}`,
                as: `${CART}`,
                onDelete: 'CASCADE',
            });
        }
    }

    product.init(
        {
            name: DataTypes.STRING,
            price: DataTypes.NUMBER,
            rating: DataTypes.NUMBER,
            image: DataTypes.STRING,
            categoryId: DataTypes.NUMBER,
            brandId: DataTypes.NUMBER,
        },
        {
            sequelize,
            modelName: `${PRODUCT}`,
            underscored: true,
        },
    );
    return product;
};
