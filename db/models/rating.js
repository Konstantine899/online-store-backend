'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class rating extends Model {
        static associate() {}
    }

    rating.init(
        {
            rating: DataTypes.NUMBER,
            userId: DataTypes.NUMBER,
            productId: DataTypes.NUMBER,
        },
        {
            sequelize,
            modelName: 'rating',
        },
    );
    return rating;
};
