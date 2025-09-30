import { QueryInterface, DataTypes } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
        // Boolean flags
        await queryInterface.addColumn('user', 'is_active', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true });
        await queryInterface.addColumn('user', 'is_newsletter_subscribed', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn('user', 'is_marketing_consent', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn('user', 'is_cookie_consent', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn('user', 'is_profile_completed', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn('user', 'is_vip_customer', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn('user', 'is_beta_tester', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn('user', 'is_blocked', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn('user', 'is_verified', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn('user', 'is_premium', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn('user', 'is_email_verified', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn('user', 'is_phone_verified', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn('user', 'is_terms_accepted', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn('user', 'is_privacy_accepted', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn('user', 'is_age_verified', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn('user', 'is_two_factor_enabled', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn('user', 'is_deleted', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn('user', 'is_suspended', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn('user', 'is_affiliate', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn('user', 'is_employee', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn('user', 'is_high_value', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn('user', 'is_wholesale', { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false });

        // Preferences and metadata
        await queryInterface.addColumn('user', 'preferred_language', { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'ru' });
        await queryInterface.addColumn('user', 'timezone', { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Europe/Moscow' });
        await queryInterface.addColumn('user', 'notification_preferences', { type: DataTypes.JSON, allowNull: false, defaultValue: {} });
        await queryInterface.addColumn('user', 'theme_preference', { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'light' });
        await queryInterface.addColumn('user', 'default_language', { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'ru' });
        await queryInterface.addColumn('user', 'translations', { type: DataTypes.JSON, allowNull: true, defaultValue: {} });

        // Timestamps
        await queryInterface.addColumn('user', 'email_verified_at', { type: DataTypes.DATE, allowNull: true });
        await queryInterface.addColumn('user', 'phone_verified_at', { type: DataTypes.DATE, allowNull: true });
        await queryInterface.addColumn('user', 'last_login_at', { type: DataTypes.DATE, allowNull: true });

        // Indexes (subset of most useful)
        await queryInterface.addIndex('user', ['is_active'], { name: 'idx_user_is_active' });
        await queryInterface.addIndex('user', ['is_newsletter_subscribed'], { name: 'idx_user_newsletter' });
        await queryInterface.addIndex('user', ['is_marketing_consent'], { name: 'idx_user_marketing' });
        await queryInterface.addIndex('user', ['is_vip_customer'], { name: 'idx_user_vip' });
        await queryInterface.addIndex('user', ['is_beta_tester'], { name: 'idx_user_beta' });
        await queryInterface.addIndex('user', ['is_blocked'], { name: 'idx_user_blocked' });
        await queryInterface.addIndex('user', ['is_verified'], { name: 'idx_user_verified' });
        await queryInterface.addIndex('user', ['is_premium'], { name: 'idx_user_premium' });
        await queryInterface.addIndex('user', ['is_email_verified'], { name: 'idx_user_email_verified_flag' });
        await queryInterface.addIndex('user', ['is_phone_verified'], { name: 'idx_user_phone_verified' });
        await queryInterface.addIndex('user', ['is_terms_accepted'], { name: 'idx_user_terms_accepted' });
        await queryInterface.addIndex('user', ['is_privacy_accepted'], { name: 'idx_user_privacy_accepted' });
        await queryInterface.addIndex('user', ['is_age_verified'], { name: 'idx_user_age_verified' });
        await queryInterface.addIndex('user', ['is_two_factor_enabled'], { name: 'idx_user_two_factor_enabled' });
        await queryInterface.addIndex('user', ['is_deleted'], { name: 'idx_user_is_deleted' });
        await queryInterface.addIndex('user', ['is_suspended'], { name: 'idx_user_is_suspended' });
        await queryInterface.addIndex('user', ['is_affiliate'], { name: 'idx_user_is_affiliate' });
        await queryInterface.addIndex('user', ['is_employee'], { name: 'idx_user_is_employee' });
        await queryInterface.addIndex('user', ['is_high_value'], { name: 'idx_user_is_high_value' });
        await queryInterface.addIndex('user', ['is_wholesale'], { name: 'idx_user_is_wholesale' });
        await queryInterface.addIndex('user', ['email_verified_at'], { name: 'idx_user_email_verified_at' });
        await queryInterface.addIndex('user', ['last_login_at'], { name: 'idx_user_last_login_at' });
        await queryInterface.addIndex('user', ['theme_preference'], { name: 'idx_user_theme_preference' });
        await queryInterface.addIndex('user', ['default_language'], { name: 'idx_user_default_language' });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
        // Remove indexes
        const indexes = [
            'idx_user_is_active','idx_user_newsletter','idx_user_marketing','idx_user_vip','idx_user_beta',
            'idx_user_blocked','idx_user_verified','idx_user_premium','idx_user_email_verified_flag','idx_user_phone_verified',
            'idx_user_terms_accepted','idx_user_privacy_accepted','idx_user_age_verified','idx_user_two_factor_enabled',
            'idx_user_is_deleted','idx_user_is_suspended','idx_user_is_affiliate','idx_user_is_employee','idx_user_is_high_value',
            'idx_user_is_wholesale','idx_user_email_verified_at','idx_user_last_login_at','idx_user_theme_preference','idx_user_default_language'
        ];
        for (const name of indexes) {
            try {
                await queryInterface.removeIndex('user', name);
            } catch (e) {
                if (process.env.NODE_ENV !== 'production') {
                    // eslint-disable-next-line no-console
                    console.warn(`[migrate] skip removeIndex ${name}:`, (e as Error).message);
                }
            }
        }

        // Remove columns (reverse order is not strictly necessary here)
        const columns = [
            'translations','default_language','theme_preference','notification_preferences','timezone','preferred_language',
            'last_login_at','phone_verified_at','email_verified_at',
            'is_wholesale','is_high_value','is_employee','is_affiliate','is_suspended','is_deleted','is_two_factor_enabled','is_age_verified',
            'is_privacy_accepted','is_terms_accepted','is_phone_verified','is_email_verified','is_premium','is_verified','is_blocked',
            'is_beta_tester','is_vip_customer','is_profile_completed','is_cookie_consent','is_marketing_consent','is_newsletter_subscribed','is_active'
        ];
        for (const col of columns) {
            try {
                await queryInterface.removeColumn('user', col);
            } catch (e) {
                if (process.env.NODE_ENV !== 'production') {
                    // eslint-disable-next-line no-console
                    console.warn(`[migrate] skip removeColumn ${col}:`, (e as Error).message);
                }
            }
        }
}


