'use strict';
const { Model } = require('sequelize');
const { PRODUCT, BRAND, CATEGORY } = require('../consts');
module.exports = (sequelize, DataTypes) => {
    class brand extends Model {
        static associate(models) {
            this.hasMany(models.product, {
                as: `${PRODUCT}`,
                onDelete: 'RESTRICT',
            });
            this.belongsTo(models.category, { as: `${CATEGORY}` });
        }
    }

    brand.init(
        {
            name: DataTypes.STRING,
            category_id: DataTypes.Number,
        },
        {
            sequelize,
            modelName: `${BRAND}`,
        },
    );
    return brand;
};
