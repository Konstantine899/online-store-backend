'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Property extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.product, { as: `product` });
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
