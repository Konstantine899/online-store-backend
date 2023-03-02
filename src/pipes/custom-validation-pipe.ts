import {
  ArgumentMetadata,
  HttpStatus,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CustomValidationException } from '../exceptions/custom-validation.exception';

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  async transform(
    value: any,
    { metatype, data }: ArgumentMetadata,
  ): Promise<any> {
    if (!metatype || !this.validateMetaType(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      let messages = errors.map((error) => {
        return {
          status: HttpStatus.BAD_REQUEST,
          property: error.property,
          messages: `${Object.values(error.constraints).join(',  ')}`,
          value: error.value,
        };
      });
      throw new CustomValidationException(messages);
    }
    return value;
  }

  private validateMetaType(metatype: Function): boolean {
    const types: Function[] = [Boolean, String, Number, Array, Object];
    return !types.includes(metatype);
  }
}
