import { HttpStatus } from '@nestjs/common';

interface IExample {
    status: number;
    property: string;
    messages: string[];
    value?: string;
}

interface IAnyOf {
    example: IExample;
}

interface ISchema {
    title: string;
    anyOf: IAnyOf[];
}

interface IValidateOrderResponse {
    description: string;
    status: number;
    schema: ISchema;
}

export function orderValidation(): IValidateOrderResponse {
    return {
        description: 'Bad Request',
        status: HttpStatus.BAD_REQUEST,
        schema: {
            title: 'Валидация',
            anyOf: [
                {
                    example: {
                        status: HttpStatus.BAD_REQUEST,
                        property: 'name',
                        messages: ['Укажите ФИО заказчика'],
                        value: '',
                    },
                },
                {
                    example: {
                        status: HttpStatus.BAD_REQUEST,
                        property: 'name',
                        messages: ['Поле ФИО не должно превышать 100 символов'],
                        value: '',
                    },
                },
                {
                    example: {
                        status: HttpStatus.BAD_REQUEST,
                        property: 'email',
                        messages: ['Укажите email заказчика'],
                        value: undefined,
                    },
                },
                {
                    example: {
                        status: HttpStatus.BAD_REQUEST,
                        property: 'email',
                        messages: ['email must be an email'],
                        value: '375298918971gmail.com',
                    },
                },

                {
                    example: {
                        status: HttpStatus.BAD_REQUEST,
                        property: 'phone',
                        messages: ['Укажите контактный номер заказчика'],
                    },
                },
                {
                    example: {
                        status: HttpStatus.BAD_REQUEST,
                        property: 'phone',
                        messages: ['Максимальная длинна телефона 15 символов'],
                    },
                },
                {
                    example: {
                        status: HttpStatus.BAD_REQUEST,
                        property: 'address',
                        messages: ['Укажите адрес доставки'],
                    },
                },
                {
                    example: {
                        status: HttpStatus.BAD_REQUEST,
                        property: 'address',
                        messages: ['Укажите адрес доставки'],
                    },
                },
                {
                    example: {
                        status: HttpStatus.BAD_REQUEST,
                        property: 'address',
                        messages: ['Максимальная длинна 200 символов'],
                    },
                },
                {
                    example: {
                        status: HttpStatus.BAD_REQUEST,
                        property: 'comment',
                        messages: ['Максимальная длинна 2200 символов'],
                    },
                },
            ],
        },
    };
}
