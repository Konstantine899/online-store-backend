import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidPhone', async: false })
export class IsValidPhoneConstraint implements ValidatorConstraintInterface {
    validate(phone: string): boolean {
        if (typeof phone !== 'string') return false;
        const normalized = phone.replace(/[\s\-()]/g, '');
        if (!/^\+?[0-9]+$/.test(normalized)) return false;
        const digits = normalized.replace(/^\+/, '');
        return digits.length >= 7 && digits.length <= 15;
    }
    defaultMessage(): string {
        return 'Номер телефона должен содержать от 7 до 15 цифр и может начинаться с +';
    }
}

export function IsValidPhone(validationOptions?: ValidationOptions) {
    return (object: object, propertyName: string) =>
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsValidPhoneConstraint,
        });
}
