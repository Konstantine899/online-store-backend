# Swagger decorators

<br/>

### auth

- `CheckUserAuthSwaggerDecorator` - описывает endpoint проверки авторизации пользователя
- `LoginSwaggerDecorator` - описывает endpoint аутентификации пользователя
- `LogoutSwaggerDecorator` - выход пользователя(завершение сеанса сессии путем удаления refresh token).
- `RegistrationSwaggerDecorator` - описывает endpoint "Регистрации" пользователя.
- `UpdateAccessTokenSwaggerDecorator` - писывает endpoint обновления access token.

<br/>
<br/>
<br/>

### brand

- `CreateBrandSwaggerDecorator` - описывает endpoint создания бренда продукта
- `GetBrandSwaggerDecorator` - описывает endpoint получения бренда
- `GetListAllBrandsSwaggerDecorator` - описывает endpoint получения списка брендов
- `RemoveBrandSwaggerDecorator` - описывает endpoint удаления бренда
- `UpdateBrandSwaggerDecorator` - описывает endpoint обновления бренда

<br/>
<br/>
<br/>

### cart

- `AppendToCartSwaggerDecorator` - описывает endpoint добавления товара в корзину
- `ClearCartSwaggerDecorator` - описывает endpoint очистки корзины
- `DecrementSwaggerDecorator` - описывает endpoint, который уменьшает количество товара в корзине
- `GetCartSwaggerDecorator` - описывает endpoint получения корзины пользователя
- `IncrementSwaggerDecorator` - описывает endpoint, который увеличивает количество товара в корзине
- `RemoveProductFromCartSwaggerDecorator` - описывает endpoint, который удаляет товар из корзины

<br/>
<br/>
<br/>

### category

- `CreateCategorySwaggerDecorator` - описывает endpoint создание категории
- `GetCategorySwaggerDecorator` - описывает endpoint получения категории
- `GetListAllCategoriesSwaggerDecorator` - описывает endpoint получения списка категорий
- `RemoveCategorySwaggerDecorator` - описывает endpoint удаления категории
- `UpdateCategorySwaggerDecorator` - описывает endpoint удаленя категории

<br/>
<br/>
<br/>

### order

- `AdminCreateOrderSwaggerDecorator` - описывает endpoint - создания заказа администратором
- `AdminGetOrderListUsersSwaggerDecorator` - описывает endpoint получения спаска заказов пользователя администратором
- `AdminGetOrderUserSwaggerDecorator` - описывает endpoint получение заказа пользователя администратором
- `AdminGetStoreOrderListSwaggerDecorator` - описывает endpoint получение списка всех заказов магазина администратором
- `AdminRemoveOrderSwaggerDecorator` - описывает endpoint удаление заказа администратором
- `GuestCreateOrderSwaggerDecorator` - описывает endpoint создание заказа гостем(не авторизованным пользователем)
- `orderValidation` - вспомогательная функция валидирующая заказ
- `UserCreateOrderSwaggerDecorator` - описывает endpoint создание заказа пользователем(авторизованным пользователем).
- `UserGetOrderListSwaggerDecorator` - получение списка заказов пользователя самим авторизованным пользователем
- `UserGetOrderSwaggerDecorator` - получение заказа пользователя самим авторизованным пользователем

<br/>
<br/>
<br/>

### payment

- `GuestMakePaymentSwaggerDecorator` - описывает endpoint оплаты заказа гостем(не авторизованным пользователем)
- `UserMakePaymentSwaggerDecorator` - описывает endpoint оплаты заказа авторизованным пользователем

<br/>
<br/>
<br/>

### product

- `CreateProductSwaggerDecorator` - описывает endpoint создания продукта
- `GetAllByBrandIdAndCategoryIdSwaggerDecorator` - описывает endpoint получение отсортированного списка продуктов по бренду и по категории товара.
- `GetListProductByBrandIdSwaggerDecorator` - описывает endpoint получение отсортированного списка продуктов по бренду товара
- `GetListProductByCategoryIdSwaggerDecorator` - описывает endpoint получение отсортированного списка продуктов по категории товара
- `GetListProductSwaggerDecorator` - описывает endpoint получение списка всех продуктов
- `GetProductSwaggerDecorator` - описывает endpoint получение продукта
- `RemoveProductSwaggerDecorator` - описывает endpoint удаления продукта
- `UpdateProductSwaggerDecorator` описывает endpoint обновления продукта

<br/>
<br/>
<br/>

### product-property

- `CreateProductPropertySwaggerDecorator` - описывает endpoint создания свойства продукта
- `GetListProductPropertySwaggerDecorator` - описывает endpoint получения списка всех свойств продукта
- `GetProductPropertySwaggerDecorator` - описывает endpoint получения свойства продукта
- `RemoveProductPropertySwaggerDecorator` - описывает endpoint удаления свойства продукта
- `UpdateProductPropertySwaggerDecorator` - описывает endpoint обновления свойства продукта

<br/>
<br/>
<br/>

### rating

- `CreateRatingSwaggerDecorator` - описывает endpoint создание рейтинга продукта
- `GetRatingSwaggerDecorator` - описывает endpoint получения рейтинга

<br/>
<br/>
<br/>

### role

- `CreateRoleSwaggerDecorator` - описывает endpoint создания роли пользователя
- `GetListRoleSwaggerDecorator` - описывает endpoint получения списка ролей пользователя
- `GetRoleSwaggerDecorator` - описывает endpoint получения роли пользователя

<br/>
<br/>
<br/>

### user

- `AddRoleUserSwaggerDecorator` - добавление роли пользователю
- `CreateUserSwaggerDecorator` - создание пользователя
- `GetListUsersSwaggerDecorator` - получение списка пользователей
- `GetUserSwaggerDecorator` - получение пользователя
- `RemoveRoleUserSwaggerDecorator` - удаление роли пользователя
- `RemoveUserSwaggerDecorator` - удаление пользователя
- `UpdateUserSwaggerDecorator` - обновление пользователя

