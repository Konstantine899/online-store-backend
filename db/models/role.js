'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class role extends Model {
        static associate(models) {
            this.belongsToMany(models.user, {
                through: 'user-role',
                as: 'users',
            });
        }
    }

    role.init(
        {
            role: DataTypes.STRING,
            description: DataTypes.STRING,
        },
        {
            sequelize,
            modelName: 'role',
        },
    );
    return role;
};
