import { QueryInterface } from 'sequelize';

/**
 * E2E Seed: Categories
 *
 * Минимальные категории для E2E тестов shopping flow
 */
export default {
    up: async (queryInterface: QueryInterface): Promise<void> => {
        await queryInterface.bulkInsert('category', [
            {
                id: 1,
                name: 'Электроника',
                slug: 'electronics',
                image: 'https://example.com/electronics.jpg',
                description: 'Категория электроники для E2E тестов',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 2,
                name: 'Одежда',
                slug: 'clothing',
                image: 'https://example.com/clothing.jpg',
                description: 'Категория одежды для E2E тестов',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
        ]);
    },

    down: async (queryInterface: QueryInterface): Promise<void> => {
        await queryInterface.bulkDelete('category', {
            id: [1, 2],
        });
    },
};
