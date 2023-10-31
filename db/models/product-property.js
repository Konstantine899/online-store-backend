'use strict';
const { Model } = require('sequelize');
const { PRODUCT_PROPERTY, PRODUCT } = require('../consts');
module.exports = (sequelize, DataTypes) => {
    class Property extends Model {
        static associate(models) {
            this.belongsTo(models.product, { as: `${PRODUCT}` });
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
            modelName: `${PRODUCT_PROPERTY}`,
            underscored: true,
        },
    );
    return Property;
};
