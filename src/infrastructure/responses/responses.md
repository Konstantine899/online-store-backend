# Responses

Использующиеся декораторы.

- `@ApiProperty` - swagger декоратор с помощью которого аннотируем поле класса.
- `@IsOptional` - декоратор указывающий, что поле может быть опциональным.
- `@IsArray` - валидационный декоратор проверяющий, что поле является массивом
- `@ValidateNested` - валидационный декоратор, проверяет внутреннее содержимое массива если в объект настроек
  validationOptions передаем each в значении true. Проверяет как примитивные типы данных, так и ссылочные.
- `@Type` - работает в тандеме с декоратором `@ValidateNested`. Аргументом принимает callback. Он в свою очередь
  возвращает interface в соответствии с которым проверяется внутреннее содержимое массива.

### CheckResponse

- `id` - идентификатор пользователя
- `email` - email пользователя
- `roles` - роли пользователя

### RegistrationResponse и LoginResponse

- `type` - тип токена Bearer
- `accessToken` - токен доступа
- `refreshToken` - токен обновления

### LogoutResponse

- `status` - http status 200
- `message` - сообщение об успешном выполнении success

### UpdateAccessTokenResponse

- `type` - тип токена Bearer
- `accessToken` - токен доступа

<br/>
<br/>
<br/>

### BrandResponse

- `id` - идентификатор бренда
- `name` - имя бренда

### CreateBrandResponse

- `id` - идентификатор бренда
- `name` - имя бренда
- `updatedAt` - время обновления
- `createdAt` - время создания

### ListAllBrandsResponse

- `id` - идентификатор бренда
- `name` - имя бренда

### RemoveBrandResponse

- `status` - http status
- `message` - сообщение о выполнении success

### UpdateBrandResponse

- `id` - идентификатор бренда
- `name` - имя бренда
- `updatedAt` - время обновления

<br/>
<br/>
<br/>

### AppendToCartResponse

- `cartId` - идентификатор корзины
- `products` - массив продуктов добавленных в корзину

### CartResponse

- `cartId` - идентификатор корзины
- `products` - массив продуктов добавленных в корзину

### CartTransformResponse

- `productId` - идентификатор продукта
- `name` - имя продукта
- `price` - цена продукта
- `quantity` - количество

### ClearCartResponse

- `cartId` - идентификатор корзины
- `products` - пустой массив продуктов добавленных в корзину

### DecrementResponse

- `cartId` - идентификатор корзины
- `products` - массив продуктов добавленных в корзину

### IncrementResponse

- `cartId` - идентификатор корзины
- `products` - массив продуктов добавленных в корзину

### RemoveProductFromCartResponse

- `cartId` - идентификатор корзины
- `products` - массив продуктов добавленных в корзину

<br/>
<br/>
<br/>

### CategoryResponse

- `id` - идентификатор продукта
- `name` - имя категории

### CreateCategoryResponse

- `id` - идентификатор категории продукта
- `name` - имя категории
- `updatedAt` - время обновления
- `createdAt` - время создания

### ListAllCategoriesResponse

- `id` - идентификатор продукта
- `name` - имя категории

### RemoveCategoryResponse

- `status` - http status
- `message` - сообщение о выполнении success

### UpdateCategoryResponse

- `id` - идентификатор категории продукта
- `name` - имя категории
- `updatedAt` - время обновления

<br/>
<br/>
<br/>

### AdminCreateOrderResponse

- `id` - идентификатор заказа
- `name` - имя заказчика
- `email` - почта заказчика
- `phone` - телефон заказчика
- `address` - адрес заказчика
- `amount` - количество товара
- `status` - статус выполнения заказа
- `comment` - комментарии пользователя к заказу
- `user_id` - идентификатор пользователя
- `items` - позиции заказа

### AdminGetOrderListUserResponse

- `id` - идентификатор заказа
- `name` - имя заказчика
- `email` - почта заказчика
- `phone` - телефон заказчика
- `address` - адрес заказчика
- `amount` - количество товара
- `status` - статус выполнения заказа
- `comment` - комментарии пользователя к заказу
- `user_id` - идентификатор пользователя
- `items` - позиции заказа

### AdminGetOrderUserResponse

- `id` - идентификатор заказа
- `name` - имя заказчика
- `email` - почта заказчика
- `phone` - телефон заказчика
- `address` - адрес заказчика
- `amount` - количество товара
- `status` - статус выполнения заказа
- `comment` - комментарии пользователя к заказу
- `user_id` - идентификатор пользователя
- `items` - позиции заказа

### AdminGetStoreOrderListResponse

- `id` - идентификатор заказа
- `name` - имя заказчика
- `email` - почта заказчика
- `phone` - телефон заказчика
- `address` - адрес заказчика
- `amount` - количество товара
- `status` - статус выполнения заказа
- `comment` - комментарии пользователя к заказу
- `user_id` - идентификатор пользователя
- `items` - позиции заказа

### GuestCreateOrderResponse

- `id` - идентификатор заказа
- `name` - имя заказчика
- `email` - почта заказчика
- `phone` - телефон заказчика
- `address` - адрес заказчика
- `amount` - количество товара
- `status` - статус выполнения заказа
- `comment` - комментарии пользователя к заказу
- `user_id` - идентификатор пользователя
- `items` - позиции заказа

### UserCreateOrderResponse

- `id` - идентификатор заказа
- `name` - имя заказчика
- `email` - почта заказчика
- `phone` - телефон заказчика
- `address` - адрес заказчика
- `amount` - количество товара
- `status` - статус выполнения заказа
- `comment` - комментарии пользователя к заказу
- `user_id` - идентификатор пользователя
- `items` - позиции заказа

### UserGetOrderResponse

- `id` - идентификатор заказа
- `name` - имя заказчика
- `email` - почта заказчика
- `phone` - телефон заказчика
- `address` - адрес заказчика
- `amount` - количество товара
- `status` - статус выполнения заказа
- `comment` - комментарии пользователя к заказу
- `user_id` - идентификатор пользователя
- `items` - позиции заказа

### UserGetOrderListResponse

- `id` - идентификатор заказа
- `name` - имя заказчика
- `email` - почта заказчика
- `phone` - телефон заказчика
- `address` - адрес заказчика
- `amount` - количество товара
- `status` - статус выполнения заказа
- `comment` - комментарии пользователя к заказу
- `user_id` - идентификатор пользователя
- `items` - позиции заказа

### AdminRemoveOrderResponse

- `status` - http status
- `message` - сообщение о выполнении success

<br/>
<br/>
<br/>

### CreateProductResponse

- `id` - идентификатор продукта
- `rating` - рейтинг продукта
- `name` - имя продукта
- `price` - цена продукта
- `brand_id` - идентификатор бренда
- `category_id` - идентификатор категории
- `image` - изображение продукта
- `updatedAt` - время обновления
- `createdAt` - время создания

### GetAllByBrandIdAndCategoryIdResponse

- `metaData` - метаданные
- `count` - количество продуктов
- `rows` - массив строк в которых находятся продукты

### GetListProductResponse

- `metaData` - метаданные
- `count` - количество продуктов
- `rows` - массив строк в которых находятся продукты

### GetListProductByBrandIdResponse

- `metaData` - метаданные
- `count` - количество продуктов
- `rows` - массив строк в которых находятся продукты

### GetListProductByCategoryIdResponse

- `metaData` - метаданные
- `count` - количество продуктов
- `rows` - массив строк в которых находятся продукты

### GetProductResponse

- `id` - идентификатор продукта
- `name` - имя продукта
- `price` - цена продукта
- `rating` - рейтинг продукта
- `image` - изображение продукта
- `brand_id` - идентификатор бренда
- `category_id` - идентификатор категории
- `properties` - характеристики продукта

### RemoveProductResponse

- `status` - http status
- `message` - сообщение о выполнении success

### UpdateProductResponse

- `id` - идентификатор продукта
- `rating` - рейтинг продукта
- `name` - имя продукта
- `price` - цена продукта
- `brand_id` - идентификатор бренда
- `category_id` - идентификатор категории
- `image` - изображение продукта
- `updatedAt` - время обновления

<br/>
<br/>
<br/>

### CreateProductPropertyResponse

- `id` - идентификатор свойство продукта
- `product_id` - идентификатор продукта
- `name` - имя свойства продукта
- `value` - значение свойства продукта
- `updatedAt` - время обновления
- `createdAt` - время создания

### UpdateProductPropertyResponse

- `id` - идентификатор свойство продукта
- `product_id` - идентификатор продукта
- `name` - имя свойства продукта
- `value` - значение свойства продукта
- `updatedAt` - время обновления

### GetListProductPropertyResponse

- `id` - идентификатор свойство продукта
- `product_id` - идентификатор продукта
- `name` - имя свойства продукта
- `value` - значение свойства продукта

### GetProductPropertyResponse

- `id` - идентификатор свойство продукта
- `product_id` - идентификатор продукта
- `name` - имя свойства продукта
- `value` - значение свойства продукта

### RemoveProductPropertyResponse

- `status` - http status
- `message` - сообщение о выполнении success

<br/>
<br/>
<br/>

### CreateRatingResponse

- `user_id` - идентификатор пользователя
- `product_id` - идентификатор продукта
- `rating` - проставленная оценка

### GetRatingResponse

- `ratingsSum` - сумма всех проставленных оценок
- `votes` - количество голосов
- `rating` - подсчитанный рейтинг(ratingsSum/votes)

<br/>
<br/>
<br/>

### CreateRoleResponse

- `id` - идентификатор роли
- `role` - роль пользователя
- `description` - описание роли пользователя

### GetListRoleResponse

- `id` - идентификатор роли
- `role` - роль пользователя
- `description` - описание роли пользователя

### GetRoleResponse

- `id` - идентификатор роли
- `role` - роль пользователя
- `description` - описание роли пользователя

<br/>
<br/>
<br/>

### AddRoleResponse

- `id` - идентификатор пользователя 
- `email` - почта пользователя
- `roles` - массив ролей пользователя

### CreateUserResponse

- `id` - идентификатор пользователя
- `email` - почта пользователя
- `roles` - массив ролей пользователя

### UpdateUserResponse

- `id` - идентификатор пользователя
- `email` - почта пользователя
- `roles` - массив ролей пользователя



### GetListUsersResponse

- `id` - идентификатор пользователя
- `email` - почта пользователя

### GetUserResponse

- `id` - идентификатор пользователя
- `email` - почта пользователя
- `roles` - массив ролей пользователя

### RemoveUserResponse

- `status` - http status
- `message` - сообщение о выполнении success

### RemoveUserRoleResponse

- `status` - http status
- `message` - сообщение о выполнении success
