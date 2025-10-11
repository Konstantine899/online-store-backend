"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    up: async (queryInterface) => {
        await queryInterface.bulkInsert('product', [
            {
                id: 1,
                name: 'iPhone 15 Pro',
                slug: 'iphone-15-pro',
                price: 99999,
                category_id: 1,
                brand_id: 1,
                description: 'Флагманский смартфон от Apple',
                image: 'https://example.com/iphone15.jpg',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 2,
                name: 'MacBook Air M2',
                slug: 'macbook-air-m2',
                price: 129999,
                category_id: 1,
                brand_id: 1,
                description: 'Легкий и мощный ноутбук',
                image: 'https://example.com/macbook.jpg',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 3,
                name: 'Nike Air Max',
                slug: 'nike-air-max',
                price: 9999,
                category_id: 2,
                brand_id: 2,
                description: 'Удобные спортивные кроссовки',
                image: 'https://example.com/airmax.jpg',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 4,
                name: 'Nike Pro T-Shirt',
                slug: 'nike-pro-tshirt',
                price: 2999,
                category_id: 2,
                brand_id: 2,
                description: 'Спортивная футболка из дышащей ткани',
                image: 'https://example.com/nike-tshirt.jpg',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                id: 5,
                name: 'AirPods Pro 2',
                slug: 'airpods-pro-2',
                price: 24999,
                category_id: 1,
                brand_id: 1,
                description: 'Беспроводные наушники с шумоподавлением',
                image: 'https://example.com/airpods.jpg',
                is_active: true,
                created_at: new Date(),
                updated_at: new Date(),
            },
        ]);
    },
    down: async (queryInterface) => {
        await queryInterface.bulkDelete('product', {
            id: [1, 2, 3, 4, 5],
        });
    },
};
