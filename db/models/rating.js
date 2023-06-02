'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class rating extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
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
