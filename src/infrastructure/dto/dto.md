# Data transfer object

Использующиеся декораторы.

- `@ApiProperty` - swagger декоратор с помощью которого аннотируем поле класса.
- `@IsNotEmpty` - валидационный декоратор, который проверяет что переданное поле не является пустым
- `@IsEmail` - валидационный декоратор, который проверяет что поле является email
- `@MinLength` - валидационный декоратор, в котором указываем что передаваемое поле должно содержать минимум символов. Первым аргументом принимает количество символов, а вторым валидационное сообщение.- 
- `@MaxLength` - валидационный декоратор, в котором указываем что передаваемое поле должно содержать максимум символов. Первым аргументом принимает количество символов, а вторым валидационное сообщение.
- `@IsString` - валидационный декоратор проверяющий, что поле является строкой
- `@IsOptional` - декоратор указывающий, что поле может быть опциональным.
- `@IsArray` - валидационный декоратор проверяющий, что поле является массивом
- `@ValidateNested` - валидационный декоратор, проверяет внутреннее содержимое массива если в объект настроек validationOptions передаем each в значении true. Проверяет как примитивные типы данных, так и ссылочные.
- `@Type` - работает в тандеме с декоратором `@ValidateNested`. Аргументом принимает callback. Он в свою очередь возвращает interface в соответствии с которым проверяется внутреннее содержимое массива.

### LoginDto

Класс LoginDto имплементирует type TLogin.
Поля email и password принимают значения типа string.

### RefreshDto

Класс RefreshDto имплементирует  IRefreshDto.
Поле refreshToken принимает значение типа string.

### RegistrationDto

Класс RegistrationDto имплементирует  type TRegistration
Поля email и password принимают значения типа string.

### BrandDto

Класс BrandDto имплементирует  ICreateBrand
Поле name принимает значение типа string.

### CreateCategoryDto

Класс CreateCategoryDto имплементирует  ICreateCategory
Поле name принимает значение типа string.

### OrderDto

Класс OrderDto имплементирует IOrderDto
Поле userId number (id заказчика если заказ оформлял авторизованный пользователь. Если не авторизованный d не будет)
Поле name string (Имя заказчика)
Поле email string (email заказчика)
Поле phone string (телефон заказчика)
Поле address string (адрес заказчика)
Поле comment string (комментарий)
Поле items: OrderItemModel[] (элементы товаров в корзине которые содержат:
id - товара, name - наименование товара, price - цена товара, quantity - количество товара, в зависимости от количества товара пересчитывается цена в позиции item товара)


### SignedCookiesDto

Класс SignedCookiesDto имплементирует  ISignedCookiesDto
Поле cartId: number (id корзины)

### UserOrderDto

Класс UserOrderDto имплементирует  IUserOrderDto
Поле id: number (id заказа)

### MakePaymentDto
Класс MakePaymentDto имплементирует  IMakePaymentDto
Поле amount: number (цена оплаты)

### CreateProductDto

Класс имплементирует  ICreateProductDto
Поле name: string (наименование товара)
Поле price: number (цена)
Поле image: Express.Multer.File (поле изображения)
Поле brandId: number (id бренда)
Поле categoryId: number (id категории)

### SearchDto

Класс имплементирует  ISearchDto.
Поле search: string (поле поиска)

### SortingDto

Класс имплементирует  ISortingDto
Поле sort: string (принимает значение DESC или ASC. Сортировка происходит по цене от большего к меньшему или наоборот)

### CreateProductPropertyDto

Класс имплементирует ICreateProductPropertyDto
Поле name: string (Имя свойства товара. К примеру: Объем встроенной памяти)
Поле value: string (Значение свойсва товара. К примеру: 256 ГБ)

### CreateRoleDto

Класс имплементирует ICreateRoleDto
Поле role: string (роль пользователя. К примеру: LAWYER)
Поле description: string (описание роли. Юрист)

### AddRoleDto

Класс имплементирует IAddRoleDto
Поле userId: number (id пользователя)
Поле role: string (роль пользователя. К примеру: LAWYER)

### CreateUserDto

Класс  имплементирует ICreateUserDto
Поле email: string
Поле password: string

### RemoveRoleDto

Класс имплементирует IRemoveRoleDto
Поля userId: number
Поля role: string