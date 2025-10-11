"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    up: async (queryInterface) => {
        await queryInterface.bulkInsert('brand', [
            {
                id: 1,
                name: 'Apple',
                category_id: 1,
                slug: 'apple',
                description: 'Apple Inc. - технологическая компания',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 2,
                name: 'Nike',
                category_id: 2,
                slug: 'nike',
                description: 'Nike - спортивная одежда и обувь',
                created_at: new Date(),
                updated_at: new Date(),
            },
        ]);
    },
    down: async (queryInterface) => {
        await queryInterface.bulkDelete('brand', {
            id: [1, 2],
        });
    },
};
