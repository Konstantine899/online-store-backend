import type { IMappingRules } from '@app/domain/models';
import { MappingRuleValidator } from '../mapping-rule-validator';

describe('MappingRuleValidator', () => {
    let validator: MappingRuleValidator;

    beforeEach(() => {
        validator = new MappingRuleValidator();
    });

    describe('validate', () => {
        it('should return valid for null', () => {
            const result = validator.validate(null);

            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('should return valid for undefined', () => {
            const result = validator.validate(undefined);

            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('should return invalid for non-object', () => {
            const result = validator.validate(
                'string' as unknown as IMappingRules,
            );

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('объектом');
        });

        it('should return valid for empty object', () => {
            const result = validator.validate({} as IMappingRules);

            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('should return valid for valid conditions', () => {
            const mappingRules: IMappingRules = {
                conditions: [
                    {
                        if: { external_role: 'admin' },
                        then: 5,
                    },
                    {
                        if: { department: 'IT', external_role: 'admin' },
                        then: 10,
                    },
                ],
            };

            const result = validator.validate(mappingRules);

            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('should return invalid if conditions is not an array', () => {
            const mappingRules = {
                conditions: 'not an array',
            } as unknown as IMappingRules;

            const result = validator.validate(mappingRules);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('массивом');
        });

        it('should return invalid if condition missing if field', () => {
            const mappingRules: IMappingRules = {
                conditions: [
                    {
                        then: 5,
                    } as { if: Record<string, unknown>; then: string | number },
                ],
            };

            const result = validator.validate(mappingRules);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('if');
        });

        it('should return invalid if condition missing then field', () => {
            const mappingRules = {
                conditions: [
                    {
                        if: { external_role: 'admin' },
                        // then отсутствует намеренно для теста
                    },
                ],
            } as unknown as IMappingRules;

            const result = validator.validate(mappingRules);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('then');
        });

        it('should return invalid if then is not string or number', () => {
            const mappingRules = {
                conditions: [
                    {
                        if: { external_role: 'admin' },
                        then: { invalid: true },
                    },
                ],
            } as unknown as IMappingRules;

            const result = validator.validate(mappingRules);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('then');
        });

        it('should return valid for valid default role (number)', () => {
            const mappingRules: IMappingRules = {
                default: 1,
            };

            const result = validator.validate(mappingRules);

            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('should return valid for valid default role (string)', () => {
            const mappingRules: IMappingRules = {
                default: 'USER',
            };

            const result = validator.validate(mappingRules);

            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('should return invalid for default role as object', () => {
            const mappingRules = {
                default: { role: 'USER' },
            } as unknown as IMappingRules;

            const result = validator.validate(mappingRules);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('default');
        });

        it('should return invalid for default role as negative number', () => {
            const mappingRules: IMappingRules = {
                default: -1,
            };

            const result = validator.validate(mappingRules);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('положительным');
        });

        it('should return invalid for default role as empty string', () => {
            const mappingRules: IMappingRules = {
                default: '',
            };

            const result = validator.validate(mappingRules);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('пустым');
        });

        it('should validate operators in conditions', () => {
            const mappingRules: IMappingRules = {
                conditions: [
                    {
                        if: {
                            department: { $eq: 'IT' },
                            location: { $in: ['Moscow', 'SPB'] },
                            email: { $contains: '@company.com' },
                        },
                        then: 10,
                    },
                ],
            };

            const result = validator.validate(mappingRules);

            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('should return invalid for unsupported operator', () => {
            const mappingRules = {
                conditions: [
                    {
                        if: {
                            department: { $unsupported: 'IT' },
                        },
                        then: 10,
                    },
                ],
            } as unknown as IMappingRules;

            const result = validator.validate(mappingRules);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors.some((e) => e.includes('оператор'))).toBe(
                true,
            );
        });

        it('should return invalid for $in operator with non-array value', () => {
            const mappingRules = {
                conditions: [
                    {
                        if: {
                            department: { $in: 'IT' },
                        },
                        then: 10,
                    },
                ],
            } as unknown as IMappingRules;

            const result = validator.validate(mappingRules);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(
                result.errors.some(
                    (e) => e.includes('$in') && e.includes('массив'),
                ),
            ).toBe(true);
        });

        it('should return invalid for $contains operator with non-string value', () => {
            const mappingRules = {
                conditions: [
                    {
                        if: {
                            email: { $contains: 123 },
                        },
                        then: 10,
                    },
                ],
            } as unknown as IMappingRules;

            const result = validator.validate(mappingRules);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(
                result.errors.some(
                    (e) => e.includes('$contains') && e.includes('строковое'),
                ),
            ).toBe(true);
        });

        it('should warn about nested operators $and and $or', () => {
            const mappingRules = {
                conditions: [
                    {
                        if: {
                            $and: [{ department: 'IT' }],
                        },
                        then: 10,
                    },
                ],
            } as unknown as IMappingRules;

            const result = validator.validate(mappingRules);

            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(
                result.errors.some(
                    (e) => e.includes('$and') || e.includes('$or'),
                ),
            ).toBe(true);
        });

        it('should handle empty conditions array', () => {
            const mappingRules: IMappingRules = {
                conditions: [],
            };

            const result = validator.validate(mappingRules);

            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });

        it('should validate complex valid mapping rules', () => {
            const mappingRules: IMappingRules = {
                conditions: [
                    {
                        if: {
                            department: { $eq: 'IT' },
                            external_role: 'admin',
                            location: { $in: ['Moscow', 'SPB'] },
                        },
                        then: 10,
                    },
                    {
                        if: { external_role: 'user' },
                        then: 1,
                    },
                ],
                default: 'GUEST',
            };

            const result = validator.validate(mappingRules);

            expect(result.valid).toBe(true);
            expect(result.errors).toEqual([]);
        });
    });
});
