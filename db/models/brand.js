'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class brand extends Model {
        static associate(models) {
            this.hasMany(models.product, {
                as: 'products',
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
            modelName: 'brand',
        },
    );
    return brand;
};
