import type { IMappingRules } from '@app/domain/models';
import { MappingRuleEngine } from '../mapping-rule-engine';

describe('MappingRuleEngine', () => {
    let engine: MappingRuleEngine;

    beforeEach(() => {
        engine = new MappingRuleEngine();
    });

    describe('evaluate', () => {
        it('should return null if mappingRules is null', () => {
            const result = engine.evaluate(null, {
                externalRoleName: 'admin',
            });

            expect(result).toBeNull();
        });

        it('should return null if mappingRules is undefined', () => {
            const result = engine.evaluate(
                undefined as unknown as IMappingRules,
                {
                    externalRoleName: 'admin',
                },
            );

            expect(result).toBeNull();
        });

        it('should return null if no conditions match', () => {
            const mappingRules: IMappingRules = {
                conditions: [
                    {
                        if: { external_role: 'admin' },
                        then: 5,
                    },
                ],
            };

            const result = engine.evaluate(mappingRules, {
                externalRoleName: 'user',
            });

            expect(result).toBeNull();
        });

        it('should match simple condition with external_role', () => {
            const mappingRules: IMappingRules = {
                conditions: [
                    {
                        if: { external_role: 'admin' },
                        then: 5,
                    },
                ],
            };

            const result = engine.evaluate(mappingRules, {
                externalRoleName: 'admin',
            });

            expect(result).not.toBeNull();
            expect(result?.matched).toBe(true);
            expect(result?.roleId).toBe(5);
            expect(result?.matchedCondition).toEqual({
                if: { external_role: 'admin' },
                then: 5,
            });
        });

        it('should match condition with userAttributes', () => {
            const mappingRules: IMappingRules = {
                conditions: [
                    {
                        if: { department: 'IT', external_role: 'admin' },
                        then: 10,
                    },
                ],
            };

            const result = engine.evaluate(mappingRules, {
                externalRoleName: 'admin',
                userAttributes: {
                    department: 'IT',
                    location: 'Moscow',
                },
            });

            expect(result).not.toBeNull();
            expect(result?.matched).toBe(true);
            expect(result?.roleId).toBe(10);
        });

        it('should not match if userAttributes do not match', () => {
            const mappingRules: IMappingRules = {
                conditions: [
                    {
                        if: { department: 'IT', external_role: 'admin' },
                        then: 10,
                    },
                ],
            };

            const result = engine.evaluate(mappingRules, {
                externalRoleName: 'admin',
                userAttributes: {
                    department: 'Sales',
                },
            });

            expect(result).toBeNull();
        });

        it('should return default role if no conditions match', () => {
            const mappingRules: IMappingRules = {
                conditions: [
                    {
                        if: { external_role: 'admin' },
                        then: 5,
                    },
                ],
                default: 1,
            };

            const result = engine.evaluate(mappingRules, {
                externalRoleName: 'user',
            });

            expect(result).not.toBeNull();
            expect(result?.matched).toBe(true);
            expect(result?.roleId).toBe(1);
        });

        it('should support $eq operator', () => {
            const mappingRules: IMappingRules = {
                conditions: [
                    {
                        if: {
                            department: { $eq: 'IT' },
                            external_role: 'admin',
                        },
                        then: 10,
                    },
                ],
            };

            const result = engine.evaluate(mappingRules, {
                externalRoleName: 'admin',
                userAttributes: {
                    department: 'IT',
                },
            });

            expect(result).not.toBeNull();
            expect(result?.matched).toBe(true);
            expect(result?.roleId).toBe(10);
        });

        it('should support $ne operator', () => {
            const mappingRules: IMappingRules = {
                conditions: [
                    {
                        if: {
                            department: { $ne: 'Sales' },
                            external_role: 'admin',
                        },
                        then: 10,
                    },
                ],
            };

            const result = engine.evaluate(mappingRules, {
                externalRoleName: 'admin',
                userAttributes: {
                    department: 'IT',
                },
            });

            expect(result).not.toBeNull();
            expect(result?.matched).toBe(true);
            expect(result?.roleId).toBe(10);
        });

        it('should support $in operator', () => {
            const mappingRules: IMappingRules = {
                conditions: [
                    {
                        if: {
                            department: { $in: ['IT', 'Engineering'] },
                            external_role: 'admin',
                        },
                        then: 10,
                    },
                ],
            };

            const result = engine.evaluate(mappingRules, {
                externalRoleName: 'admin',
                userAttributes: {
                    department: 'IT',
                },
            });

            expect(result).not.toBeNull();
            expect(result?.matched).toBe(true);
            expect(result?.roleId).toBe(10);
        });

        it('should support $contains operator for strings', () => {
            const mappingRules: IMappingRules = {
                conditions: [
                    {
                        if: {
                            email: { $contains: '@company.com' },
                            external_role: 'admin',
                        },
                        then: 10,
                    },
                ],
            };

            const result = engine.evaluate(mappingRules, {
                externalRoleName: 'admin',
                userAttributes: {
                    email: 'user@company.com',
                },
            });

            expect(result).not.toBeNull();
            expect(result?.matched).toBe(true);
            expect(result?.roleId).toBe(10);
        });

        it('should support $startsWith operator', () => {
            const mappingRules: IMappingRules = {
                conditions: [
                    {
                        if: {
                            email: { $startsWith: 'admin' },
                            external_role: 'admin',
                        },
                        then: 10,
                    },
                ],
            };

            const result = engine.evaluate(mappingRules, {
                externalRoleName: 'admin',
                userAttributes: {
                    email: 'admin@company.com',
                },
            });

            expect(result).not.toBeNull();
            expect(result?.matched).toBe(true);
            expect(result?.roleId).toBe(10);
        });

        it('should support $endsWith operator', () => {
            const mappingRules: IMappingRules = {
                conditions: [
                    {
                        if: {
                            email: { $endsWith: '@company.com' },
                            external_role: 'admin',
                        },
                        then: 10,
                    },
                ],
            };

            const result = engine.evaluate(mappingRules, {
                externalRoleName: 'admin',
                userAttributes: {
                    email: 'user@company.com',
                },
            });

            expect(result).not.toBeNull();
            expect(result?.matched).toBe(true);
            expect(result?.roleId).toBe(10);
        });

        it('should support role name as string in then', () => {
            const mappingRules: IMappingRules = {
                conditions: [
                    {
                        if: { external_role: 'admin' },
                        then: 'ADMIN_ROLE',
                    },
                ],
            };

            const result = engine.evaluate(mappingRules, {
                externalRoleName: 'admin',
            });

            expect(result).not.toBeNull();
            expect(result?.matched).toBe(true);
            expect(result?.roleName).toBe('ADMIN_ROLE');
            expect(result?.roleId).toBeNull();
        });

        it('should support role ID as string number in then', () => {
            const mappingRules: IMappingRules = {
                conditions: [
                    {
                        if: { external_role: 'admin' },
                        then: '10',
                    },
                ],
            };

            const result = engine.evaluate(mappingRules, {
                externalRoleName: 'admin',
            });

            expect(result).not.toBeNull();
            expect(result?.matched).toBe(true);
            expect(result?.roleId).toBe(10);
        });

        it('should return first matching condition', () => {
            const mappingRules: IMappingRules = {
                conditions: [
                    {
                        if: { external_role: 'admin' },
                        then: 5,
                    },
                    {
                        if: { external_role: 'admin', department: 'IT' },
                        then: 10,
                    },
                ],
            };

            const result = engine.evaluate(mappingRules, {
                externalRoleName: 'admin',
                userAttributes: {
                    department: 'IT',
                },
            });

            expect(result).not.toBeNull();
            expect(result?.matched).toBe(true);
            // Должно вернуть первое совпадение
            expect(result?.roleId).toBe(5);
        });

        it('should handle empty conditions array', () => {
            const mappingRules: IMappingRules = {
                conditions: [],
                default: 1,
            };

            const result = engine.evaluate(mappingRules, {
                externalRoleName: 'admin',
            });

            expect(result).not.toBeNull();
            expect(result?.matched).toBe(true);
            expect(result?.roleId).toBe(1);
        });

        it('should handle condition with missing if or then', () => {
            const mappingRules: IMappingRules = {
                conditions: [
                    {
                        if: {},
                        then: 5,
                    } as { if: Record<string, unknown>; then: string | number },
                    {
                        if: { external_role: 'admin' },
                        then: 10,
                    },
                ],
            };

            const result = engine.evaluate(mappingRules, {
                externalRoleName: 'admin',
            });

            expect(result).not.toBeNull();
            expect(result?.matched).toBe(true);
            // Должно пропустить первое условие и вернуть второе
            expect(result?.roleId).toBe(10);
        });

        describe('ReDoS protection', () => {
            it('should reject patterns longer than MAX_PATTERN_LENGTH for $contains', () => {
                const longPattern = 'a'.repeat(2000); // Превышает MAX_PATTERN_LENGTH (1000)
                const mappingRules: IMappingRules = {
                    conditions: [
                        {
                            if: {
                                department: { $contains: longPattern },
                            },
                            then: 5,
                        },
                    ],
                };

                const result = engine.evaluate(mappingRules, {
                    externalRoleName: 'admin',
                    userAttributes: {
                        department: 'IT Department',
                    },
                });

                expect(result).toBeNull();
            });

            it('should reject patterns longer than MAX_PATTERN_LENGTH for $startsWith', () => {
                const longPattern = 'a'.repeat(2000);
                const mappingRules: IMappingRules = {
                    conditions: [
                        {
                            if: {
                                department: { $startsWith: longPattern },
                            },
                            then: 5,
                        },
                    ],
                };

                const result = engine.evaluate(mappingRules, {
                    externalRoleName: 'admin',
                    userAttributes: {
                        department: 'IT Department',
                    },
                });

                expect(result).toBeNull();
            });

            it('should reject patterns longer than MAX_PATTERN_LENGTH for $endsWith', () => {
                const longPattern = 'a'.repeat(2000);
                const mappingRules: IMappingRules = {
                    conditions: [
                        {
                            if: {
                                department: { $endsWith: longPattern },
                            },
                            then: 5,
                        },
                    ],
                };

                const result = engine.evaluate(mappingRules, {
                    externalRoleName: 'admin',
                    userAttributes: {
                        department: 'IT Department',
                    },
                });

                expect(result).toBeNull();
            });

            it('should accept patterns within MAX_PATTERN_LENGTH', () => {
                const validPattern = 'a'.repeat(500); // В пределах лимита
                const mappingRules: IMappingRules = {
                    conditions: [
                        {
                            if: {
                                department: { $contains: validPattern },
                            },
                            then: 5,
                        },
                    ],
                };

                const result = engine.evaluate(mappingRules, {
                    externalRoleName: 'admin',
                    userAttributes: {
                        department: `${validPattern}Department`,
                    },
                });

                expect(result).not.toBeNull();
                expect(result?.matched).toBe(true);
                expect(result?.roleId).toBe(5);
            });
        });
    });
});
