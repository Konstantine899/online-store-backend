"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = definePromoCode;
const sequelize_1 = require("sequelize");
class PromoCode extends sequelize_1.Model {
    isValid() {
        if (!this.is_active) {
            return false;
        }
        const now = new Date();
        if (this.valid_from > now) {
            return false;
        }
        if (this.valid_until && this.valid_until < now) {
            return false;
        }
        if (this.usage_limit && this.usage_count >= this.usage_limit) {
            return false;
        }
        return true;
    }
    meetsMinimumPurchase(purchaseAmount) {
        if (!this.min_purchase_amount) {
            return true;
        }
        return purchaseAmount >= this.min_purchase_amount;
    }
    calculateDiscount(totalAmount) {
        if (this.discount_type === 'PERCENT') {
            return (totalAmount * this.discount_value) / 100;
        }
        else {
            return Math.min(this.discount_value, totalAmount);
        }
    }
    async incrementUsage() {
        this.usage_count += 1;
        await this.save();
    }
    static associate(models) {
    }
}
function definePromoCode(sequelize) {
    PromoCode.init({
        id: {
            type: sequelize_1.DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
        },
        code: {
            type: sequelize_1.DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        discount_type: {
            type: sequelize_1.DataTypes.ENUM('PERCENT', 'FIXED'),
            allowNull: false,
            defaultValue: 'PERCENT',
        },
        discount_value: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        valid_from: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        valid_until: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: true,
        },
        usage_limit: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: true,
        },
        usage_count: {
            type: sequelize_1.DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        min_purchase_amount: {
            type: sequelize_1.DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0,
        },
        is_active: {
            type: sequelize_1.DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        created_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
        updated_at: {
            type: sequelize_1.DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize_1.DataTypes.NOW,
        },
    }, {
        sequelize,
        modelName: 'promo_code',
        tableName: 'promo_codes',
        timestamps: true,
        underscored: true,
        scopes: {
            active: {
                where: {
                    is_active: true,
                },
            },
            valid: {
                where: {
                    is_active: true,
                    valid_from: {
                        [sequelize_1.Op.lte]: new Date(),
                    },
                    [sequelize_1.Op.or]: [
                        { valid_until: null },
                        {
                            valid_until: {
                                [sequelize_1.Op.gte]: new Date(),
                            },
                        },
                    ],
                },
            },
        },
    });
    return PromoCode;
}
