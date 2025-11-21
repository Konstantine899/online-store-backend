import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Кастомный валидатор для проверки корректности is_system_role + tenant_id
 * Правила:
 * 1. Системные роли (is_system_role=true) должны иметь tenant_id=null
 * 2. Tenant-specific роли (is_system_role=false) должны иметь tenant_id NOT NULL
 */
@ValidatorConstraint({ name: 'isValidRoleTenant', async: false })
export class IsValidRoleTenantConstraint
    implements ValidatorConstraintInterface
{
    validate(value: unknown, args: ValidationArguments): boolean {
        const object = args.object as {
            isSystemRole?: boolean;
            tenantId?: number | null;
        };

        const isSystemRole = object.isSystemRole ?? false;
        const tenantId = object.tenantId;

        // Проверка 1: Системная роль не должна иметь tenant_id
        if (isSystemRole === true && tenantId !== null && tenantId !== undefined) {
            return false;
        }

        // Проверка 2: Tenant-specific роль должна иметь tenant_id
        if (isSystemRole === false && (tenantId === null || tenantId === undefined)) {
            return false;
        }

        return true;
    }

    defaultMessage(args: ValidationArguments): string {
        const object = args.object as {
            isSystemRole?: boolean;
            tenantId?: number | null;
        };

        const isSystemRole = object.isSystemRole ?? false;
        const tenantId = object.tenantId;

        if (isSystemRole === true && tenantId !== null && tenantId !== undefined) {
            return 'Системные роли (is_system_role=true) должны иметь tenant_id=null';
        }

        if (isSystemRole === false && (tenantId === null || tenantId === undefined)) {
            return 'Tenant-specific роли (is_system_role=false) должны иметь указанный tenant_id';
        }

        return 'Некорректная комбинация is_system_role и tenant_id';
    }
}

/**
 * Декоратор для валидации корректности is_system_role + tenant_id
 * @param validationOptions - опции валидации
 */
export function IsValidRoleTenant(
    validationOptions?: ValidationOptions,
): PropertyDecorator {
    return function (object: object, propertyName: string | symbol): void {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName as string,
            options: validationOptions,
            constraints: [],
            validator: IsValidRoleTenantConstraint,
        });
    };
}

