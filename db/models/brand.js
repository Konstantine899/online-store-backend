'use strict';
const { Model } = require('sequelize');
const { PRODUCT, BRAND } = require('../consts');
module.exports = (sequelize, DataTypes) => {
    class brand extends Model {
        static associate(models) {
            this.hasMany(models.product, {
                as: `${PRODUCT}`,
                onDelete: 'RESTRICT',
            });
        }
    }

    brand.init(
        {
            name: DataTypes.STRING,
        },
        {
            sequelize,
            modelName: `${BRAND}`,
        },
    );
    return brand;
};
