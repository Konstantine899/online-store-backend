'use strict';
const {Model} = require('sequelize');
const {PRODUCT, BRAND} = require('../consts');
// eslint-disable-next-line prettier/prettier
module.exports = (sequelize, DataTypes): void => {
    class brand extends Model {
        static associate(models): void {
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
