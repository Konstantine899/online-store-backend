import {
    ArgumentMetadata,
    HttpException,
    HttpStatus,
    Injectable,
    PipeTransform,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
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

        const object = plainToInstance(metatype, value, {
            enableImplicitConversion: false,
            excludeExtraneousValues: false,
        });

        const errors = await validate(object, {
            whitelist: true,
            forbidNonWhitelisted: true,
            forbidUnknownValues: true,
            skipMissingProperties: false,
            validationError: {
                target: false,
                value: true,
            },
        });

        if (errors.length > 0) {
            const formatErrors: ICustomValidationPipe[] =
                this.formatValidationErrors(errors);
            throw new HttpException(formatErrors, HttpStatus.BAD_REQUEST);
        }
        return value;
    }

    private formatValidationErrors(
        errors: ValidationError[],
    ): ICustomValidationPipe[] {
        return errors.map((error) => {
            const messages = error.constraints
                ? Object.values(error.constraints)
                : ['Ошибка валидации'];

            return {
                status: HttpStatus.BAD_REQUEST,
                property: error.property,
                messages: messages,
                value: error.value,
            };
        });
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
