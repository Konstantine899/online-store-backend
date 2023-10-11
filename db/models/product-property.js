'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Property extends Model {
        static associate(models) {
            this.belongsTo(models.product, { as: 'product' });
        }
    }

    Property.init(
        {
            name: DataTypes.STRING,
            value: DataTypes.STRING,
            productId: DataTypes.INTEGER,
        },
        {
            sequelize,
            modelName: 'product-property',
        },
    );
    return Property;
};
