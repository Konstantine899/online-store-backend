## Pipes

<br/>
<br/>
<br/>

## CustomValidationPipe

```ts
import {
    ArgumentMetadata,
    HttpException,
    HttpStatus,
    Injectable,
    PipeTransform,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Login } from '../../modules/auth/dto/login.dto';
import { Refresh } from '../../modules/auth/dto/refresh.dto';
import { Registration } from '../../modules/auth/dto/registration.dto';
import { CreateBrand } from '../../modules/brand/dto/create-brand.dto';
import { CreateCategory } from '../../modules/category/dto/create-category.dto';
import { Order } from '../../modules/order/dto/order.dto';
import { RequestSignedCookies } from '../../modules/order/dto/request-signed-cookies.dto';
import { RequestUser } from '../../modules/order/dto/request-user.dto';
import { MakePayment } from '../../modules/payment/dto/make-payment.dto';
import { CreateProduct } from '../../modules/product/dto/create-product.dto';
import { PaginateProduct } from '../../modules/product/dto/paginate-product.dto';
import { SearchQuery } from '../../modules/product/dto/search-query.dto';
import { SortQuery } from '../../modules/product/dto/sort-query.dto';
import { CreateProductProperty } from '../../modules/product-property/dto/create-product-property.dto';
import { CreateRole } from '../../modules/role/dto/create-role.dto';
import { AddRole } from '../../modules/user/dto/add-role.dto';
import { CreateUser } from '../../modules/user/dto/create-user.dto';
import { RemoveRole } from '../../modules/user/dto/remove-role.dto';

type AuthValue = Registration | Login | Refresh;
type BrandValue = CreateBrand;
type CategoryValue = CreateCategory;
type OrderValue = Order | RequestSignedCookies | RequestUser;
type PaymentValue = MakePayment;
type ProductValue = CreateProduct | PaginateProduct | SearchQuery | SortQuery;
type ProductPropertyValue = CreateProductProperty;
type RoleValue = CreateRole;
type UserValue = AddRole | CreateUser | RemoveRole;

type Value =
    | AuthValue
    | BrandValue
    | CategoryValue
    | OrderValue
    | PaymentValue
    | ProductValue
    | ProductPropertyValue
    | RoleValue
    | UserValue;

export interface FormatErrors {
    status: HttpStatus;
    property: string;
    messages: string[];
    value: Value;
}

@Injectable()
export class CustomValidationPipe
    implements PipeTransform<Value, Promise<FormatErrors[] | Value>>
{
    public async transform(
        value: Value,
        { metatype }: ArgumentMetadata,
    ): Promise<FormatErrors[] | Value> {
        if (!metatype || !this.validateMetaType(metatype)) {
            return value;
        }

        const object = plainToInstance(metatype, value);
        const errors = await validate(object);

        if (errors.length > 0) {
            const formatErrors: FormatErrors[] = errors.map((error) => {
                return {
                    status: HttpStatus.BAD_REQUEST,
                    property: error.property,
                    messages: `${Object.values(error.constraints).join(
                        ', ',
                    )}`.split(', '),
                    value: error.value,
                };
            });
            throw new HttpException(formatErrors, HttpStatus.BAD_REQUEST);
        }
        return value;
    }

    private validateMetaType(metatype: Function): boolean {
        const types: Function[] = [Boolean, String, Number, Array, Object];
        return !types.includes(metatype);
    }
}

```

`Pipes` - это класс, аннотированный с помощью декоратора `@Injectable` и реализующий интерфейс `PipeTransform`.
`CustomValidationPipe` используется для валидации: проверки корректности входных данных.

В файле декларации типов можно увидеть что `PipeTransform<T, R>` в `generic` принимает два типа.
- `T` - это тип входного значения (`value`)
- `R` - тип значения возвращаемого методом `transform`

Метод `transform` принимает два параметра

- `value` — аргумент, переданный обработчику
- `metadata` — объект со следующими свойствами:
     * `type` — тип аргумента: `'body'` | `'query'` | `'param'` | `'custom'`
     * `metatype` — тип данных аргумента, например, `String`
     * `data` — строка, переданная декоратору, например, `@Body('string')`

Вспомогательная функция `validateMetaType` предназначена для пропуска валидации. Когда обрабатываемый аргумент имеет нативный тип `JS`, то к такому аргументу нельзя добавить декораторы для валидации. Выполнять валидацию бессмысленно. 

По-этому в первом условии если нет `metadata` или обрабатываемы аргумент имеет нативный тип, то просто возвращаю `value`.

Функция `plainToInstance` предназначена для преобразования обычного объекта `JS в` типизированный объект для применения валидации. Это делается потому что `request` `body` не содержит информации о типах, а `class-validator` нуждается в них для применения декораторов для валидации, определенных нами в `DTO`.

С помощью функции `validate` произвожу валидацию объекта `object`.

После чего если ошибки найдены привожу их в удобочитаемый вид.

- `status` - статус ошибки 
- `property` - поле в котором произошла ошибка(к примеру `email` или `password`)
- `messages` - здесь по подробнее. Все сообщения об ошибках валидации содержаться в объекте `error`.`constraints`. С помощью `Object.values` получаю все значения из объекта `constrains`. Таким образом получаю массив значений. Далее с помощью метода `join` формирую подстроку в которой каждый элемент массива разбиваю запятыми. После чего с помощью `split` формирую новый массив где одна валидационная ошибка будет помещаться в отдельный `index` массива.
- `value` - это значение отправленное пользователем.

Ошибки передаю клиенту с помощью `HttpException` где первым аргументом передаю массив валидационных ошибок, а вторым аргументом статус ошибки. 