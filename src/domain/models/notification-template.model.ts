import {
    Model,
    DataType,
    Column,
    Table,
    AfterCreate,
    AfterUpdate,
    AfterDestroy,
} from 'sequelize-typescript';
import { Op } from 'sequelize';
import { NotificationModel } from './notification.model';
import { NotificationType } from './notification.types';
import { HasMany } from 'sequelize-typescript';

interface INotificationTemplateModel {
    id: number;
    name: string;
    type: NotificationType;
    subject?: string;
    title: string;
    message: string;
    variables: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface INotificationTemplateCreationAttributes {
    name: string;
    type: NotificationType;
    subject?: string;
    title: string;
    message: string;
    variables?: string[];
    isActive?: boolean;
}

@Table({
    tableName: 'notification_templates',
    underscored: true,
    timestamps: true,
    defaultScope: {
        attributes: { exclude: ['updatedAt', 'createdAt'] },
    },
    scopes: {
        // Scope для поиска по имени
        byName: (name: string) => ({
            where: { name },
        }),
        // Scope для поиска по типу
        byType: (type: NotificationType) => ({
            where: { type },
        }),
        // Scope для активных шаблонов
        active: {
            where: { isActive: true },
        },
        // Scope для неактивных шаблонов
        inactive: {
            where: { isActive: false },
        },
        // Scope для email шаблонов
        email: {
            where: { type: NotificationType.EMAIL },
        },
        // Scope для push шаблонов
        push: {
            where: { type: NotificationType.PUSH },
        },
        // Scope для поиска по части имени
        byNameLike: (name: string) => ({
            where: {
                name: {
                    [Op.like]: `%${name}%`,
                },
            },
        }),
    },
    indexes: [
        {
            fields: ['name'],
            name: 'idx_notification_templates_name',
            unique: true,
        },
        { fields: ['type'], name: 'idx_notification_templates_type' },
        { fields: ['is_active'], name: 'idx_notification_templates_is_active' },
        // Композитный индекс для ускорения частых выборок по типу/активности/имени
        {
            fields: ['type', 'is_active', 'name'],
            name: 'idx_notification_templates_type_active_name',
        },
    ],
})
export class NotificationTemplateModel
    extends Model<
        NotificationTemplateModel,
        INotificationTemplateCreationAttributes
    >
    implements INotificationTemplateModel
{
    // --- КЭШИРОВАНИЕ (LRU + TTL) ---
    private static readonly CACHE_TTL_MS = 60_000; // 60 секунд
    private static readonly CACHE_MAX_ENTRIES = 200;
    private static readonly cache = new Map<string, { value: unknown; ts: number }>();

    private static getCache<T>(key: string): T | undefined {
        const entry = this.cache.get(key);
        if (!entry) {
            return undefined;
        }
        const now = Date.now();
        if (now - entry.ts > this.CACHE_TTL_MS) {
            this.cache.delete(key);
            return undefined;
        }
        return entry.value as T;
    }

    private static setCache<T>(key: string, value: T): void {
        if (this.cache.size >= this.CACHE_MAX_ENTRIES) {
            const firstKey = this.cache.keys().next().value as string | undefined;
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, { value, ts: Date.now() });
    }

    private static invalidateCache(pattern?: string): void {
        if (!pattern) {
            this.cache.clear();
            return;
        }
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.cache.delete(key);
            }
        }
    }

    @Column({
        type: DataType.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    })
    declare id: number;

    @Column({
        type: DataType.STRING(50),
        allowNull: false,
        unique: true,
    })
    declare name: string;

    @Column({
        type: DataType.ENUM(...Object.values(NotificationType)),
        allowNull: false,
    })
    declare type: NotificationType;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
    })
    declare subject: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: false,
    })
    declare title: string;

    @Column({
        type: DataType.TEXT,
        allowNull: false,
    })
    declare message: string;

    @Column({
        type: DataType.JSON,
        allowNull: false,
        defaultValue: [],
    })
    declare variables: string[];

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
    })
    declare isActive: boolean;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
        field: 'created_at',
    })
    declare createdAt: Date;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
        field: 'updated_at',
    })
    declare updatedAt: Date;

    @HasMany(() => NotificationModel, {
        foreignKey: 'templateName',
        sourceKey: 'name',
    })
    declare notifications?: NotificationModel[];

    // Методы для работы с переменными
    getVariablesList(): string[] {
        return Array.isArray(this.variables) ? this.variables : [];
    }

    hasVariable(variableName: string): boolean {
        return this.getVariablesList().includes(variableName);
    }

    addVariable(variableName: string): void {
        const variables = this.getVariablesList();
        if (!variables.includes(variableName)) {
            variables.push(variableName);
            this.variables = variables;
        }
    }

    removeVariable(variableName: string): void {
        const variables = this.getVariablesList();
        this.variables = variables.filter((v) => v !== variableName);
    }

    // Методы для работы с шаблоном
    async activate(): Promise<void> {
        await this.update({ isActive: true });
    }

    async deactivate(): Promise<void> {
        await this.update({ isActive: false });
    }

    // Статические методы для работы с шаблонами
    static async getActiveTemplates(): Promise<NotificationTemplateModel[]> {
        const cacheKey = 'active:list';
        const cached = this.getCache<NotificationTemplateModel[]>(cacheKey);
        if (cached) {
            return cached;
        }
        const result = await this.findAll({
            where: { isActive: true },
            order: [['name', 'ASC']],
        });
        this.setCache(cacheKey, result);
        return result;
    }

    static async getTemplatesByType(
        type: NotificationType,
    ): Promise<NotificationTemplateModel[]> {
        const cacheKey = `type:${type}:active:list`;
        const cached = this.getCache<NotificationTemplateModel[]>(cacheKey);
        if (cached) {
            return cached;
        }
        const result = await this.findAll({
            where: { type, isActive: true },
            order: [['name', 'ASC']],
        });
        this.setCache(cacheKey, result);
        return result;
    }

    static async getEmailTemplates(): Promise<NotificationTemplateModel[]> {
        return this.getTemplatesByType(NotificationType.EMAIL);
    }

    static async getPushTemplates(): Promise<NotificationTemplateModel[]> {
        return this.getTemplatesByType(NotificationType.PUSH);
    }

    static async findByName(
        name: string,
    ): Promise<NotificationTemplateModel | null> {
        const cacheKey = `byName:${name}`;
        const cached = this.getCache<NotificationTemplateModel | null>(cacheKey);
        if (cached !== undefined) {
            return cached;
        }
        const result = await this.findOne({ where: { name } });
        this.setCache(cacheKey, result);
        return result;
    }

    static async findActiveByName(
        name: string,
    ): Promise<NotificationTemplateModel | null> {
        const cacheKey = `byName:${name}:active`;
        const cached = this.getCache<NotificationTemplateModel | null>(cacheKey);
        if (cached !== undefined) {
            return cached;
        }
        const result = await this.findOne({ where: { name, isActive: true } });
        this.setCache(cacheKey, result);
        return result;
    }

    // --- ИНВАЛИДАЦИЯ КЭША ЧЕРЕЗ ХУКИ ---
    @AfterCreate
    static onAfterCreateHook(): void {
        // Инвалидируем все списки и точечные ключи по имени/типу
        this.invalidateCache();
    }

    @AfterUpdate
    static onAfterUpdateHook(): void {
        this.invalidateCache();
    }

    @AfterDestroy
    static onAfterDestroyHook(): void {
        this.invalidateCache();
    }
}
