import { QueryInterface, QueryTypes } from 'sequelize';
import * as bcrypt from 'bcrypt';

interface Seeder {
    up(queryInterface: QueryInterface): Promise<void>;
    down(queryInterface: QueryInterface): Promise<void>;
}

const seeder: Seeder = {
    async up(queryInterface: QueryInterface): Promise<void> {
        const passwordHash = await bcrypt.hash('Password123!', 10);


        await queryInterface.bulkInsert('user', [
            {
                email: 'kostay375298918971@gmail.com',
                password: passwordHash,
                phone: '+79991234567',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                email: 'admin@example.com',
                password: passwordHash,
                phone: '+15550000001',
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                email: 'user@example.com',
                password: passwordHash,
                phone: '+15550000002',
                created_at: new Date(),
                updated_at: new Date(),
            },
        ]);
        // Получаем id ролей
        interface RoleRow { id: number; role: string }
        const roles = await queryInterface.sequelize.query<RoleRow>(
            "SELECT id, role FROM role WHERE role IN ('ADMIN','USER');",
            { type: QueryTypes.SELECT },
        );
        const adminRoleId = roles.find((r: RoleRow) => r.role === 'ADMIN')?.id;
        const userRoleId = roles.find((r: RoleRow) => r.role === 'USER')?.id;

        // Получаем id пользователей
        interface UserRow { id: number; email: string }
        const users = await queryInterface.sequelize.query<UserRow>(
            "SELECT id, email FROM user WHERE email IN ('admin@example.com','user@example.com');",
            { type: QueryTypes.SELECT },
        );
        const adminUserId = users.find((u: UserRow) => u.email === 'admin@example.com')?.id;
        const userUserId = users.find((u: UserRow) => u.email === 'user@example.com')?.id;

        // Присваиваем роли через user_role
        const now = new Date();
        const rowsToInsert: Array<{ role_id: number; user_id: number; created_at: Date; updated_at: Date }> = [];

        if (adminRoleId && adminUserId) {
            rowsToInsert.push({ role_id: adminRoleId, user_id: adminUserId, created_at: now, updated_at: now });
        }
        if (userRoleId && userUserId) {
            rowsToInsert.push({ role_id: userRoleId, user_id: userUserId, created_at: now, updated_at: now });
        }

        if (rowsToInsert.length > 0) {
            await queryInterface.bulkInsert('user_role', rowsToInsert);
        }
    },

    async down(queryInterface: QueryInterface): Promise<void> {
        // Находим id пользователей
        interface DownUserRow { id: number }
        const users = await queryInterface.sequelize.query<DownUserRow>(
            "SELECT id FROM user WHERE email IN ('admin@example.com','user@example.com');",
            { type: QueryTypes.SELECT },
        );
        const userIds = users.map((u: DownUserRow) => u.id);

        // Чистим связи и пользователей
        if (userIds.length > 0) {
            await queryInterface.bulkDelete('user_role', { user_id: userIds }, {});
        }
        await queryInterface.bulkDelete('user', { email: ['admin@example.com', 'user@example.com'] }, {});
    },
};

export default seeder;
