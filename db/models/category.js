'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class category extends Model {
        static associate(models) {
            this.hasMany(models.product, {
                as: 'products',
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
            modelName: 'category',
        },
    );
    return category;
};
