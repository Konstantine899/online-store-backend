'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  order.init(
    {
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      phone: DataTypes.STRING,
      address: DataTypes.STRING,
      amount: DataTypes.FLOAT,
      status: DataTypes.INTEGER,
      comment: DataTypes.STRING(2200),
      userId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: 'order',
    },
  );
  return order;
};
