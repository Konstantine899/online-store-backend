'use strict';
const { Model } = require('sequelize');
const { PRODUCT, CATEGORY, BRAND } = require('../consts');
module.exports = (sequelize, DataTypes) => {
    class category extends Model {
        static associate(models) {
            this.hasMany(models.product, {
                as: `${PRODUCT}`,
                onDelete: 'RESTRICT',
            });
            this.hasMany(models.brand, {
                as: `${BRAND}`,
                onDelete: 'RESTRICT',
            });
        }
    }

    category.init(
        {
            name: DataTypes.STRING,
        },
        {
            sequelize,
            modelName: `${CATEGORY}`,
        },
    );
    return category;
};
