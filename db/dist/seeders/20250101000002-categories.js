"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    up: async (queryInterface) => {
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
    down: async (queryInterface) => {
        await queryInterface.bulkDelete('category', {
            id: [1, 2],
        });
    },
};
