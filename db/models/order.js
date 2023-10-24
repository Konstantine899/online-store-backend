'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class order extends Model {
        static associate(models) {
            this.belongsTo(models.user, { as: 'user' });
            this.hasMany(models.item, {
                as: 'items',
                onDelete: 'CASCADE',
            });
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
            user_id: DataTypes.INTEGER,
        },
        {
            sequelize,
            modelName: 'order',
            underscored: true,
        },
    );
    return order;
};
