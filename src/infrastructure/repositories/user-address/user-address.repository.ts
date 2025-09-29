import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { UserAddressModel } from '@app/domain/models';
import { CreateUserAddressDto, UpdateUserAddressDto } from '@app/infrastructure/dto';
import { CreateUserAddressResponse, GetUserAddressResponse, UpdateUserAddressResponse } from '@app/infrastructure/responses';


@Injectable()
export class UserAddressRepository {
    constructor(
        @InjectModel(UserAddressModel)
        private readonly userAddressModel: typeof UserAddressModel,
    ) {}

    public async create(
        userId: number,
        dto: CreateUserAddressDto,
    ): Promise<CreateUserAddressResponse> {
        const address = await this.userAddressModel.create({
            user_id: userId,
            ...dto,
        } as any); // eslint-disable-line @typescript-eslint/no-explicit-any
        return address as CreateUserAddressResponse;
    }

    public async findAll(userId: number): Promise<GetUserAddressResponse[]> {
        return this.userAddressModel.findAll({
            where: { user_id: userId },
            order: [['is_default', 'DESC'], ['created_at', 'ASC']],
        }) as Promise<GetUserAddressResponse[]>;
    }

    public async findOne(userId: number, id: number): Promise<GetUserAddressResponse | null> {
        return this.userAddressModel.findOne({
            where: { id, user_id: userId },
        }) as Promise<GetUserAddressResponse | null>;
    }

    public async update(
        userId: number,
        id: number,
        dto: UpdateUserAddressDto,
    ): Promise<UpdateUserAddressResponse | null> {
        const address = await this.userAddressModel.findOne({ where: { id, user_id: userId } });
        if (!address) return null;
        await address.update(dto);
        return address as UpdateUserAddressResponse;
    }

    public async setDefault(userId: number, id: number): Promise<UpdateUserAddressResponse | null> {
        const address = await this.userAddressModel.findOne({ where: { id, user_id: userId } });
        if (!address) return null;

        await this.userAddressModel.update({ is_default: false }, { where: { user_id: userId } });
        await address.update({ is_default: true });

        return address as UpdateUserAddressResponse;
    }

    public async remove(userId: number, id: number): Promise<number> {
        return this.userAddressModel.destroy({ where: { id, user_id: userId } });
    }
}