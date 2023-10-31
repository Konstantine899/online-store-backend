'use strict';
const {Model} = require('sequelize');
const {PRODUCT, CATEGORY} = require('../consts');
// eslint-disable-next-line prettier/prettier
module.exports = (sequelize, DataTypes): void => {
    class category extends Model {
        static associate(models): void {
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
