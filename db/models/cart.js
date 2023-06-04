'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize) => {
  class Cart extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsToMany(models.product, {
        through: `cart-product`,
        as: `products`,
        onDelete: 'CASCADE',
      });
    }
  }
  Cart.init(
    {},
    {
      sequelize,
      modelName: 'Cart',
    },
  );
  return Cart;
};
