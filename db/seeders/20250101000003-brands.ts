import { QueryInterface } from 'sequelize';

/**
 * E2E Seed: Brands
 *
 * Минимальные бренды для E2E тестов shopping flow
 */
export default {
    up: async (queryInterface: QueryInterface): Promise<void> => {
        await queryInterface.bulkInsert('brand', [
            {
                id: 1,
                name: 'Apple',
                category_id: 1, // Электроника
                slug: 'apple',
                description: 'Apple Inc. - технологическая компания',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 2,
                name: 'Nike',
                category_id: 2, // Одежда
                slug: 'nike',
                description: 'Nike - спортивная одежда и обувь',
                created_at: new Date(),
                updated_at: new Date(),
            },
        ]);
    },

    down: async (queryInterface: QueryInterface): Promise<void> => {
        await queryInterface.bulkDelete('brand', {
            id: [1, 2],
        });
    },
};
