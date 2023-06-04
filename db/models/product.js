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
      models.cart = undefined;
      this.belongsTo(models.brand, { as: `brand` });
      this.belongsTo(models.category, { as: `category` });
      this.hasMany(models.property, { as: `properties`, onDelete: `CASCADE` });
      this.belongsToMany(models.user, {
        through: `rating`,
        as: `users`,
        onDelete: `CASCADE`,
      });
      this.belongsToMany(models.cart, {
        through: `cart-product`,
        as: `baskets`,
        onDelete: 'CASCADE',
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
