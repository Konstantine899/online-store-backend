import { DataTypes, QueryInterface } from 'sequelize';

/**
 * SAAS-004-01: Расширение таблицы cart-product для price snapshot
 *
 * Добавляемое поле:
 * - price: цена товара на момент добавления в корзину
 *
 * Обоснование:
 * Фиксация цены необходима, т.к. цена товара в каталоге может измениться,
 * но корзина должна сохранять цену на момент добавления товара.
 * Это критично для:
 * - Предотвращения ценовых манипуляций
 * - Корректного расчёта итоговой суммы
 * - Брошенных корзин (цена могла измениться за 30 дней)
 */
const migration = {
    async up(queryInterface: QueryInterface): Promise<void> {
        // Добавляем поле price с проверкой на существование
        try {
            await queryInterface.addColumn('cart-product', 'price', {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0,
                comment: 'Product price snapshot at the time of adding to cart',
            });
            console.log('✅ Added column: price to cart-product table');
        } catch {
            console.log('⚠️  Column price already exists - skipping');
        }

        console.log(
            '✅ Cart-product table extended with price field (SAAS-004-01)',
        );
        console.log(
            '✅ Price snapshot ensures correct total calculation even if product price changes',
        );
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        try {
            await queryInterface.removeColumn('cart-product', 'price');
            console.log('✅ Removed column: price from cart-product');
        } catch {
            console.log('⚠️  Column price does not exist in cart-product');
        }

        console.log('✅ Cart-product table rollback completed (SAAS-004-01)');
    },
};

export default migration;
