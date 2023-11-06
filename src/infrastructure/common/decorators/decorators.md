# Decorators

### roles-auth.decorator.ts

```ts
import {SetMetadata} from '@nestjs/common';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: string[]): Function => {
    return SetMetadata(ROLES_KEY, roles);
};

```

Это декоратор, который аргументом принимает массив ролей пользователя.
Декоратор `SetMetadata` позволяет реализовать кастомный декоратор. Он присваивает метаданные функции или классу с помощью
указанного ключа. Аргументами он требует два параметра

- `key` - это значение, под которым хранятся метаданные.
- `value` - метаданные, которые будут связаны с `key`.

Эти метаданные можно отобразить с помощью класса `Reflector`. Пример: `@SetMetadata('roles', ['admin'])`.

