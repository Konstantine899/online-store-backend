'use strict';
const { Model } = require('sequelize');
const { PRODUCT, CATEGORY } = require('../consts');
module.exports = (sequelize, DataTypes) => {
    class category extends Model {
        static associate(models) {
            this.hasMany(models.product, {
                as: `${PRODUCT}`,
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
