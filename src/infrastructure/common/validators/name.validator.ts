import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidName', async: false })
export class IsValidNameConstraint implements ValidatorConstraintInterface {
    validate(name: string): boolean {
        if (typeof name !== 'string') return false;
        const trimmed = name.trim();
        if (trimmed.length < 2 || trimmed.length > 100) return false;
        return /^[a-zA-Zа-яА-Я\s\-']+$/.test(trimmed);
    }
    defaultMessage(): string {
        return 'Имя должно содержать от 2 до 100 символов, только буквы, пробелы, дефисы и апострофы';
    }
}

export function IsValidName(validationOptions?: ValidationOptions) {
    return (object: object, propertyName: string): void =>
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsValidNameConstraint,
        });
}
