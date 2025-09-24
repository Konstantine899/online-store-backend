# Database Migrations with TypeScript

Этот проект полностью переведен на TypeScript для миграций базы данных.

## Структура

- `config/` - конфигурация базы данных (TypeScript)
- `consts/` - константы для имен таблиц и внешних ключей (TypeScript)
- `migrations/` - файлы миграций (TypeScript)
- `models/` - модели Sequelize (TypeScript)
- `seeders/` - сидеры для заполнения базы данных (TypeScript)

## Использование TypeScript миграций

### Создание новой миграции

```bash
# Создание миграции с TypeScript поддержкой
npm run db:migration:generate create-example-table

# Файл будет создан с расширением .ts и готовым TypeScript шаблоном
```

### Пример TypeScript миграции

```typescript
import { QueryInterface, DataTypes } from 'sequelize';
import { TABLE_NAMES, FOREIGN_KEYS } from '../consts';

interface Migration {
  up(queryInterface: QueryInterface, Sequelize: typeof DataTypes): Promise<void>;
  down(queryInterface: QueryInterface): Promise<void>;
}

const migration: Migration = {
  async up(queryInterface: QueryInterface, Sequelize: typeof DataTypes): Promise<void> {
    await queryInterface.createTable(TABLE_NAMES.EXAMPLE, {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      // ... другие поля
    });
  },

  async down(queryInterface: QueryInterface): Promise<void> {
    await queryInterface.dropTable(TABLE_NAMES.EXAMPLE);
  },
};

export = migration;
```

### Доступные команды

```bash
# Линтинг TypeScript файлов в db/
npm run db:lint

# Автоисправление ошибок линтера
npm run db:lint:fix

# Компиляция TypeScript файлов
npm run db:build

# Создание новой миграции
npm run db:migration:generate create-example-table

# Запуск миграций
npm run db:migrate

# Откат последней миграции
npm run db:migrate:undo

# Откат всех миграций
npm run db:migrate:undo:all

# Запуск сидеров
npm run db:seed:all

# Откат всех сидеров
npm run db:seed:undo:all
```

## Константы

Используйте константы из `consts/index.ts` для имен таблиц и внешних ключей:

```typescript
import { TABLE_NAMES, FOREIGN_KEYS } from '../consts';

// Имена таблиц
TABLE_NAMES.PRODUCT
TABLE_NAMES.USER
TABLE_NAMES.CATEGORY

// Внешние ключи
FOREIGN_KEYS.USER_ID
FOREIGN_KEYS.CATEGORY_ID
FOREIGN_KEYS.PRODUCT_ID
```

## TypeScript модели

Все модели Sequelize переведены на TypeScript с полной типизацией:

### Структура модели

```typescript
import { Model, DataTypes, Sequelize } from 'sequelize';
import { TABLE_NAMES } from '../consts';
import { UserModel, UserCreationAttributes } from './types';

export default (sequelize: Sequelize, DataTypes: typeof DataTypes) => {
  class User extends Model<UserModel, UserCreationAttributes> implements UserModel {
    declare id: number;
    declare email: string;
    declare password: string;
    declare created_at: Date;
    declare updated_at: Date;

    static associate(models: any): void {
      this.hasMany(models.refreshToken, {
        as: TABLE_NAMES.REFRESH_TOKEN,
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      // ... другие поля
    },
    {
      sequelize,
      modelName: TABLE_NAMES.USER,
      tableName: TABLE_NAMES.USER,
      timestamps: true,
      underscored: false,
    },
  );

  return User;
};
```

### Типы моделей

Все типы определены в `models/types.ts`:

```typescript
export interface UserAttributes {
  id: number;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at'> {}

export interface UserModel extends Model<UserAttributes, UserCreationAttributes>, UserAttributes {}
```

## Преимущества TypeScript миграций и моделей

1. **Типизация** - полная поддержка типов TypeScript
2. **Автодополнение** - IDE поддержка с автодополнением
3. **Проверка ошибок** - статическая проверка типов
4. **ESLint поддержка** - проверка кода по правилам проекта
5. **Рефакторинг** - безопасный рефакторинг с переименованием
6. **Документация** - самодокументируемый код с типами
7. **Строгая типизация моделей** - полная типизация атрибутов и связей
8. **Безопасность типов** - предотвращение ошибок на этапе компиляции
