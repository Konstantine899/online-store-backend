import { QueryInterface } from 'sequelize';

interface Seeder {
  up(queryInterface: QueryInterface): Promise<void>;
  down(queryInterface: QueryInterface): Promise<void>;
}

const seeder: Seeder = {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkInsert('role', [
      {
        role: 'ADMIN',
        description: 'Администратор',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        role: 'USER',
        description: 'Пользователь',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkDelete('role', {}, {});
  },
};

export default seeder;