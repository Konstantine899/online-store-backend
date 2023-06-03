'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RefreshToken extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.user);
    }
  }
  RefreshToken.init(
    {
      is_revoked: DataTypes.BOOLEAN,
      expires: DataTypes.DATE,
    },
    {
      sequelize,
      modelName: 'refresh-token',
    },
  );
  return RefreshToken;
};
