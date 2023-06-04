'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class product extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.brand);
      this.belongsTo(models.category);
      this.belongsToMany(models.user, {
        through: `rating`,
        as: `users`,
        onDelete: `CASCADE`,
      });
    }
  }
  product.init(
    {
      name: DataTypes.STRING,
      price: DataTypes.NUMBER,
      rating: DataTypes.NUMBER,
      image: DataTypes.STRING,
      categoryId: DataTypes.NUMBER,
      brandId: DataTypes.NUMBER,
    },
    {
      sequelize,
      modelName: 'product',
    },
  );
  return product;
};
