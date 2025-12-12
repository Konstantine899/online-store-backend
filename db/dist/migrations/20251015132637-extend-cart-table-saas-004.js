"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const migration = {
    async up(queryInterface) {
        const columnsToAdd = [
            {
                name: 'user_id',
                definition: {
                    type: sequelize_1.DataTypes.INTEGER,
                    allowNull: true,
                    references: {
                        model: 'user',
                        key: 'id',
                    },
                    onUpdate: 'CASCADE',
                    onDelete: 'SET NULL',
                    comment: 'User ID for authenticated users cart',
                },
            },
            {
                name: 'session_id',
                definition: {
                    type: sequelize_1.DataTypes.STRING(255),
                    allowNull: true,
                    comment: 'Session ID for guest carts',
                },
            },
            {
                name: 'status',
                definition: {
                    type: sequelize_1.DataTypes.STRING(20),
                    allowNull: false,
                    defaultValue: 'active',
                    comment: 'Cart status: active, abandoned, converted, expired',
                },
            },
            {
                name: 'expired_at',
                definition: {
                    type: sequelize_1.DataTypes.DATE,
                    allowNull: true,
                    comment: 'Cart expiration timestamp (30 days inactive)',
                },
            },
            {
                name: 'promo_code',
                definition: {
                    type: sequelize_1.DataTypes.STRING(50),
                    allowNull: true,
                    comment: 'Applied promo code',
                },
            },
            {
                name: 'discount',
                definition: {
                    type: sequelize_1.DataTypes.DECIMAL(10, 2),
                    allowNull: false,
                    defaultValue: 0,
                    comment: 'Discount amount from promo code',
                },
            },
            {
                name: 'total_amount',
                definition: {
                    type: sequelize_1.DataTypes.DECIMAL(10, 2),
                    allowNull: false,
                    defaultValue: 0,
                    comment: 'Total cart amount (including discount)',
                },
            },
        ];
        for (const column of columnsToAdd) {
            try {
                await queryInterface.addColumn('cart', column.name, column.definition);
                console.log(`✅ Added column: ${column.name} to cart table`);
            }
            catch {
                console.log(`⚠️  Column ${column.name} already exists - skipping`);
            }
        }
        const indexesToAdd = [
            {
                name: 'idx_cart_tenant_user',
                columns: ['tenant_id', 'user_id'],
                description: 'быстрый поиск корзины авторизованного пользователя',
            },
            {
                name: 'idx_cart_tenant_session',
                columns: ['tenant_id', 'session_id'],
                description: 'быстрый поиск гостевой корзины',
            },
            {
                name: 'idx_cart_tenant_status',
                columns: ['tenant_id', 'status'],
                description: 'фильтрация по статусу (active, abandoned, etc.)',
            },
            {
                name: 'idx_cart_tenant_expired',
                columns: ['tenant_id', 'expired_at'],
                description: 'cleanup expired carts',
            },
            {
                name: 'idx_cart_tenant_promo',
                columns: ['tenant_id', 'promo_code'],
                description: 'аналитика промокодов',
            },
        ];
        for (const index of indexesToAdd) {
            try {
                await queryInterface.addIndex('cart', index.columns, {
                    name: index.name,
                });
                console.log(`✅ Added index: ${index.name} (${index.description})`);
            }
            catch {
                console.log(`⚠️  Index ${index.name} already exists - skipping`);
            }
        }
        try {
            await queryInterface.addColumn('cart-product', 'price', {
                type: sequelize_1.DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
                comment: 'Product price snapshot at the time of adding to cart',
            });
            console.log('✅ Added column: price to cart-product table');
        }
        catch {
            console.log('⚠️  Column price already exists - skipping');
        }
        console.log('✅ Cart tables extended with SaaS fields (SAAS-004-01)');
        console.log('✅ Added fields to cart: user_id, session_id, status, expired_at, promo_code, discount, total_amount');
        console.log('✅ Added field to cart-product: price (price snapshot)');
        console.log('✅ Added 5 composite indexes for tenant isolation');
    },
    async down(queryInterface) {
        try {
            await queryInterface.removeIndex('cart', 'idx_cart_tenant_promo');
            console.log('✅ Removed index: idx_cart_tenant_promo');
        }
        catch {
            console.log('⚠️  Index idx_cart_tenant_promo does not exist');
        }
        try {
            await queryInterface.removeIndex('cart', 'idx_cart_tenant_expired');
            console.log('✅ Removed index: idx_cart_tenant_expired');
        }
        catch {
            console.log('⚠️  Index idx_cart_tenant_expired does not exist');
        }
        try {
            await queryInterface.removeIndex('cart', 'idx_cart_tenant_status');
            console.log('✅ Removed index: idx_cart_tenant_status');
        }
        catch {
            console.log('⚠️  Index idx_cart_tenant_status does not exist');
        }
        try {
            await queryInterface.removeIndex('cart', 'idx_cart_tenant_session');
            console.log('✅ Removed index: idx_cart_tenant_session');
        }
        catch {
            console.log('⚠️  Index idx_cart_tenant_session does not exist');
        }
        try {
            await queryInterface.removeIndex('cart', 'idx_cart_tenant_user');
            console.log('✅ Removed index: idx_cart_tenant_user');
        }
        catch {
            console.log('⚠️  Index idx_cart_tenant_user does not exist');
        }
        try {
            await queryInterface.removeColumn('cart-product', 'price');
            console.log('✅ Removed column: price from cart-product');
        }
        catch {
            console.log('⚠️  Column price does not exist in cart-product');
        }
        try {
            await queryInterface.removeColumn('cart', 'total_amount');
            console.log('✅ Removed column: total_amount');
        }
        catch {
            console.log('⚠️  Column total_amount does not exist');
        }
        try {
            await queryInterface.removeColumn('cart', 'discount');
            console.log('✅ Removed column: discount');
        }
        catch {
            console.log('⚠️  Column discount does not exist');
        }
        try {
            await queryInterface.removeColumn('cart', 'promo_code');
            console.log('✅ Removed column: promo_code');
        }
        catch {
            console.log('⚠️  Column promo_code does not exist');
        }
        try {
            await queryInterface.removeColumn('cart', 'expired_at');
            console.log('✅ Removed column: expired_at');
        }
        catch {
            console.log('⚠️  Column expired_at does not exist');
        }
        try {
            await queryInterface.removeColumn('cart', 'status');
            console.log('✅ Removed column: status');
        }
        catch {
            console.log('⚠️  Column status does not exist');
        }
        try {
            await queryInterface.removeColumn('cart', 'session_id');
            console.log('✅ Removed column: session_id');
        }
        catch {
            console.log('⚠️  Column session_id does not exist');
        }
        try {
            await queryInterface.removeColumn('cart', 'user_id');
            console.log('✅ Removed column: user_id');
        }
        catch {
            console.log('⚠️  Column user_id does not exist');
        }
        console.log('✅ Cart table rollback completed (SAAS-004-01)');
    },
};
exports.default = migration;
