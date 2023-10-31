'use strict';
const {Model} = require('sequelize');
const {RATING} = require('../consts');
// eslint-disable-next-line prettier/prettier
module.exports = (sequelize, DataTypes): void => {
    class rating extends Model {
        static associate(): void {
        }
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
