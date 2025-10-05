import { Model, DataType, Column, Table } from 'sequelize-typescript';
import { Op } from 'sequelize';
import { NotificationType } from './notification.model';

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
        { fields: ['name'], name: 'idx_notification_templates_name', unique: true },
        { fields: ['type'], name: 'idx_notification_templates_type' },
        { fields: ['is_active'], name: 'idx_notification_templates_is_active' },
    ],
})
export class NotificationTemplateModel
    extends Model<NotificationTemplateModel, INotificationTemplateCreationAttributes>
    implements INotificationTemplateModel
{
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
        this.variables = variables.filter(v => v !== variableName);
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
        return this.findAll({
            where: { isActive: true },
            order: [['name', 'ASC']],
        });
    }

    static async getTemplatesByType(type: NotificationType): Promise<NotificationTemplateModel[]> {
        return this.findAll({
            where: { type, isActive: true },
            order: [['name', 'ASC']],
        });
    }

    static async getEmailTemplates(): Promise<NotificationTemplateModel[]> {
        return this.getTemplatesByType(NotificationType.EMAIL);
    }

    static async getPushTemplates(): Promise<NotificationTemplateModel[]> {
        return this.getTemplatesByType(NotificationType.PUSH);
    }

    static async findByName(name: string): Promise<NotificationTemplateModel | null> {
        return this.findOne({
            where: { name },
        });
    }

    static async findActiveByName(name: string): Promise<NotificationTemplateModel | null> {
        return this.findOne({
            where: { name, isActive: true },
        });
    }
}
