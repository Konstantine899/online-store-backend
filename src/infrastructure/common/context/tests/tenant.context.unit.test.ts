import { TenantContext } from '../tenant.context';

describe('TenantContext', () => {
    let tenantContext: TenantContext;

    beforeEach(() => {
        tenantContext = new TenantContext();
    });

    describe('setTenantId / getTenantId', () => {
        it('should set and get tenant ID', () => {
            tenantContext.setTenantId(42);

            expect(tenantContext.getTenantId()).toBe(42);
        });

        it('should throw error when getTenantId called before setTenantId', () => {
            expect(() => tenantContext.getTenantId()).toThrow(
                'TenantContext: tenantId not set',
            );
        });

        it('should update tenant ID when set multiple times', () => {
            tenantContext.setTenantId(1);
            tenantContext.setTenantId(2);
            tenantContext.setTenantId(3);

            expect(tenantContext.getTenantId()).toBe(3);
        });
    });

    describe('getTenantIdOrNull', () => {
        it('should return null when tenant ID not set', () => {
            expect(tenantContext.getTenantIdOrNull()).toBeNull();
        });

        it('should return tenant ID when set', () => {
            tenantContext.setTenantId(99);

            expect(tenantContext.getTenantIdOrNull()).toBe(99);
        });
    });

    describe('hasTenantId', () => {
        it('should return false when tenant ID not set', () => {
            expect(tenantContext.hasTenantId()).toBe(false);
        });

        it('should return true when tenant ID set', () => {
            tenantContext.setTenantId(1);

            expect(tenantContext.hasTenantId()).toBe(true);
        });
    });

    describe('clear', () => {
        it('should clear tenant ID', () => {
            tenantContext.setTenantId(123);
            expect(tenantContext.hasTenantId()).toBe(true);

            tenantContext.clear();

            expect(tenantContext.hasTenantId()).toBe(false);
            expect(tenantContext.getTenantIdOrNull()).toBeNull();
        });

        it('should throw error after clear when calling getTenantId', () => {
            tenantContext.setTenantId(123);
            tenantContext.clear();

            expect(() => tenantContext.getTenantId()).toThrow(
                'TenantContext: tenantId not set',
            );
        });
    });

    describe('edge cases', () => {
        it('should handle tenant ID = 0', () => {
            tenantContext.setTenantId(0);

            expect(tenantContext.getTenantId()).toBe(0);
            expect(tenantContext.hasTenantId()).toBe(true);
        });

        it('should handle large tenant IDs', () => {
            const largeTenantId = 2147483647; // Max INT

            tenantContext.setTenantId(largeTenantId);

            expect(tenantContext.getTenantId()).toBe(largeTenantId);
        });
    });
});

