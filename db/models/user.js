'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) {
            this.hasMany(models.refreshToken, {
                as: 'refresh_tokens',
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            });
            this.hasMany(models.order, {
                as: 'orders',
                onDelete: 'SET NULL',
            });
            this.belongsToMany(models.role, {
                through: 'user-role',
                as: 'roles',
            });
            this.belongsToMany(models.product, {
                through: 'rating',
                as: 'products',
                onDelete: 'CASCADE',
            });
        }
    }

    User.init(
        {
            email: DataTypes.STRING,
            password: DataTypes.STRING,
        },
        {
            sequelize,
            modelName: 'User',
        },
    );
    return User;
};
