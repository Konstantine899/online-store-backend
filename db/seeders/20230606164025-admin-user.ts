import { QueryInterface } from 'sequelize';
import * as bcrypt from 'bcrypt';

interface Seeder {
  up(queryInterface: QueryInterface): Promise<void>;
  down(queryInterface: QueryInterface): Promise<void>;
}

const seeder: Seeder = {
  async up(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.bulkInsert('user', [
      {
        email: 'kostay375298918971@gmail.com',
        password: await bcrypt.hash('123456', 10),
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await queryInterface.sequelize.query(
      'SELECT `roleId`, `userId` FROM `user-role` AS `UserRoleModel` WHERE `UserRoleModel`.`userId` = 1',
    );

    await queryInterface.sequelize.query(
      'INSERT INTO `user-role` (`roleId`,`userId`) VALUES (1,1)',
    );

    await queryInterface.sequelize.query(
      'SELECT `roleId`, `userId` FROM `user-role` AS `UserRoleModel` WHERE `UserRoleModel`.`userId` = 2',
    );

    await queryInterface.sequelize.query(
      'INSERT INTO `user-role` (`roleId`,`userId`) VALUES (2,1)',
    );
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS=0;'); // Отключаю проверку внешнего ключа
    await queryInterface.bulkDelete('user-role', null, {});
    await queryInterface.bulkDelete('user', null, {});
  },
};

export default seeder;