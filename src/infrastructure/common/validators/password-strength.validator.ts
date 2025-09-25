import {
    registerDecorator,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isPasswordStrong', async: false })
export class IsPasswordStrongConstraint
    implements ValidatorConstraintInterface
{
    validate(password: string) {
        if (!password) return false;

        // Минимальная длина 8 символов
        if (password.length < 8) return false;

        // Должен содержать хотя бы одну заглавную букву
        if (!/[A-Z]/.test(password)) return false;

        // Должен содержать хотя бы одну строчную букву
        if (!/[a-z]/.test(password)) return false;

        // Должен содержать хотя бы одну цифру
        if (!/\d/.test(password)) return false;

        // Должен содержать хотя бы один специальный символ
        if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) return false;

        // Запрещенные простые пароли
        const commonPasswords = [
            'password',
            '123456',
            '123456789',
            'qwerty',
            'abc123',
            'password123',
            'admin',
            'letmein',
            'welcome',
            'monkey',
            '1234567890',
            'password1',
            'qwerty123',
            'dragon',
            'master',
        ];

        if (commonPasswords.includes(password.toLowerCase())) return false;

        return true;
    }

    defaultMessage() {
        return 'Пароль должен содержать минимум 8 символов, включая заглавные и строчные буквы, цифры и специальные символы. Простые пароли запрещены.';
    }
}

export function IsPasswordStrong(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsPasswordStrongConstraint,
        });
    };
}
