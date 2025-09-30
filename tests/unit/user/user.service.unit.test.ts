import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UserService } from '@app/infrastructure/services/user/user.service';
import { UserRepository } from '@app/infrastructure/repositories';
import { UserModel } from '@app/domain/models';

jest.mock('bcrypt', () => ({
    compare: jest.fn(async (a: string, b: string) => a === b),
    hash: jest.fn(async (val: string) => `hashed:${val}`),
}));

describe('UserService', () => {
    let service: UserService;
    let userRepository: jest.Mocked<UserRepository>;
    let userModelMock: any;

    beforeEach(() => {
        userRepository = {
            findUserByPkId: jest.fn(),
            findUserByEmail: jest.fn(),
        } as unknown as jest.Mocked<UserRepository>;

        userModelMock = {} as unknown as typeof UserModel;

        // RoleService в этих тестах не используется
        const roleServiceDummy: any = {};

        service = new UserService(
            userRepository as any,
            roleServiceDummy,
            userModelMock,
        );
    });

    describe('updatePhone', () => {
        it('updates phone and returns user with id and phone', async () => {
            (userRepository as any).updatePhone = jest.fn().mockResolvedValue({ id: 10, phone: '+79990001122' });
            const result = await service.updatePhone(10, '+79990001122');
            expect((userRepository as any).updatePhone).toHaveBeenCalledWith(10, '+79990001122');
            expect(result).toEqual({ id: 10, phone: '+79990001122' });
        });

        it('throws NotFoundException when user not updated', async () => {
            (userRepository as any).updatePhone = jest.fn().mockResolvedValue(null);
            await expect(service.updatePhone(1, '+7999'))
                .rejects
                .toBeInstanceOf(NotFoundException);
        });

        it('maps SequelizeValidationError to BadRequestException', async () => {
            const err = new Error('validation');
            (err as any).name = 'SequelizeValidationError';
            (userRepository as any).updatePhone = jest.fn().mockRejectedValue(err);
            await expect(service.updatePhone(1, 'bad'))
                .rejects
                .toBeInstanceOf(BadRequestException);
        });
    });

    describe('changePassword', () => {
        it('throws NotFoundException when user not found', async () => {
            (userRepository.findUserByPkId as jest.Mock).mockResolvedValue(null);
            await expect(service.changePassword(1, 'OldPass123!', 'NewPass123!'))
                .rejects
                .toBeInstanceOf(NotFoundException);
        });

        it('throws BadRequestException when old password mismatch', async () => {
            (userRepository.findUserByPkId as jest.Mock).mockResolvedValue({ id: 1, email: 'a@b.c' });
            (userRepository.findUserByEmail as jest.Mock).mockResolvedValue({ id: 1, email: 'a@b.c', password: 'hashed-other' });
            await expect(service.changePassword(1, 'OldPass123!', 'NewPass123!'))
                .rejects
                .toBeInstanceOf(BadRequestException);
        });

        it('updates password on success', async () => {
            const userWithPassword = { id: 1, email: 'a@b.c', password: 'OldPass123!', update: jest.fn() };
            (userRepository.findUserByPkId as jest.Mock).mockResolvedValue({ id: 1, email: 'a@b.c' });
            (userRepository.findUserByEmail as jest.Mock).mockResolvedValue(userWithPassword);

            await service.changePassword(1, 'OldPass123!', 'NewPass123!');
            expect(userWithPassword.update).toHaveBeenCalledWith({ password: 'hashed:NewPass123!' });
        });
    });
});


