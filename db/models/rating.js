'use strict';
const { Model } = require('sequelize');
const { RATING } = require('../consts');
module.exports = (sequelize, DataTypes) => {
    class rating extends Model {
        static associate() {}
    }

    rating.init(
        {
            rating: DataTypes.NUMBER,
            user_id: DataTypes.NUMBER,
            product_id: DataTypes.NUMBER,
        },
        {
            sequelize,
            modelName: `${RATING}`,
        },
    );
    return rating;
};
