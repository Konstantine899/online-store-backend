import {
    ArgumentMetadata,
    HttpException,
    HttpStatus,
    Injectable,
    PipeTransform,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ICustomValidationPipe, TValue } from '@app/domain/pipes';

@Injectable()
export class CustomValidationPipe
    implements PipeTransform<TValue, Promise<ICustomValidationPipe[] | TValue>>
{
    public async transform(
        value: TValue,
        { metatype }: ArgumentMetadata,
    ): Promise<ICustomValidationPipe[] | TValue> {
        if (!metatype || !this.validateMetaType(metatype)) {
            return value;
        }

        const object = plainToInstance(metatype, value);
        const errors = await validate(object);

        if (errors.length > 0) {
            const formatErrors: ICustomValidationPipe[] = errors.map(
                (error) => {
                    return {
                        status: HttpStatus.BAD_REQUEST,
                        property: error.property,
                        messages: Object.values(error.constraints || {})
                            .join(', ')
                            .split(', '),
                        value: error.value,
                    };
                },
            );
            throw new HttpException(formatErrors, HttpStatus.BAD_REQUEST);
        }
        return value;
    }

    private validateMetaType(
        metatype: new (...args: unknown[]) => unknown,
    ): boolean {
        const types: (new (...args: unknown[]) => unknown)[] = [
            Boolean,
            String,
            Number,
            Array,
            Object,
        ];
        return !types.includes(metatype);
    }
}
