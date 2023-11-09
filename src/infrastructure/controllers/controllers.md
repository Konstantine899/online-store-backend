# Controllers

Каждый контроллер аннотирован декоратором @Controller, который аргументом принимает prefix. Prefix - это часть пути по
которому мы можем достучаться до контроллера.

Каждый контроллер имплементируют одноименный interface в котором описаны методы использующиеся в данном контроллере.

Каждый контроллер аннотирован декоратором @ApiTags. Аргументом он принимает название контроллера. С помощью данного
декоратора происходит объединение группы endpoints использующихся в данном контроллере.

В constructor каждого контроллера внедряем необходимые зависимости(dependency injection), необходимые для контроллера.

Каждый endpoint аннотирован группой декораторов:

- `swagger decorators` - описывающий endpoint
- `@HttpCode` - ожидаемы статус код который вернет данный endpoint
- `HTTP method` - который использует endpoint (@Post, @Put, @Patch, @Get, @Delete и т.д).
- `@UseInterceptors` - перехватчики. Позволяет передавать interceptors. Interceptors позволяют выполнять какие-то
  действия до или после выполнения endpoints. К примеру FileInterceptor. Первым аргументом принимает имя обрабатываемого
  поля из body request. А вторым аргументом принимает объект опций.

Так же некоторые endpoints аннотированы декораторами:

- `@Roles` - аргументом принимает массив ролей пользователя, которым разрешен доступ к endpoint.
- `@UseGuards` - аргументом принимает guards в которых происходят различного рода проверки. Например, в AuthGuard
  происходит проверка авторизации пользователя в системе. В RoleGuard - происходит проверка, обладает ли пользователь
  достаточными правами доступа к данному endpoint. Проверка происходит по ролям.

<br/>
<br/>
<br/>

### AuthController

- `registration` - endpoint регистрации пользователя.
- `login` - endpoint с помощью которого происходит аутентификация пользователя в системе.
- `updateAccessToken` - endpoint по которому происходит обновление access token.
- `checkUserAuth` - endpoint по которому происходит проверка авторизации пользователя в системе.
- `logout` - endpoint по которому происходит выход пользователя из системы.

<br/>
<br/>
<br/>

### BrandController

- `createBrand` - endpoint создания бренда
- `getListAllBrands` - получение списка всех брендов
- `getBrand` - получение одного бренда
- `updateBrand` - обновление бренда
- `removeBrand` - удаление бренда

<br/>
<br/>
<br/>

### CartController

- `getCart` - получение корзины
- `appendToCart` - добавление товара в корзину
- `increment` - увеличение количества товара в корзине
- `decrement` - уменьшение количества товара в корзине
- `removeProductFromCart` - удаление товара из корзины
- `clearCart` - очистка, удаление всех товаров из корзины

<br/>
<br/>
<br/>

### CategoryController

- `createCategory` - создание категории
- `getListAllCategories` - получение списка всех категорий
- `getCategory` - получение категории
- `updateCategory` - обновление категории
- `removeCategory` - удаление категории

<br/>
<br/>
<br/>

### OrderController

- `adminGetStoreOrderList` - пользователь с role ADMIN. Получение всех списков заказов магазина
- `adminGetOrderListUser` - пользователь с role ADMIN. Получение списка заказов пользователя
- `adminGetOrderUser` - пользователь с role ADMIN. Получить заказ пользователя
- `adminCreateOrder` - пользователь с role ADMIN. Создание заказа.
- `adminRemoveOrder` - пользователь с role ADMIN. Удаление заказа.
- `userGetOrderList` - пользователь с role USER. Получение списка заказов.
- `userGetOrder` - пользователь с role USER. Получение заказа.
- `userGetOrder` - пользователь с role USER. Создание заказа.
- `guestCreateOrder` - не авторизованный пользователь. Создание заказа.

<br/>
<br/>
<br/>

### PaymentController

- `userMakePayment` - пользователь с role USER. Произведение оплаты
- `guestMakePayment` - не авторизованный пользователь. Произведение оплаты

<br/>
<br/>
<br/>

### ProductController

- `create` - ADMIN. Создание продукта.
- `update` - ADMIN. Обновление продукта.
- `removeProduct` - ADMIN. Удаление продукта.
- `getProduct` - получение продукта
- `getListProduct` - получение списка продуктов
- `getListProductByBrandId` - получение списка продуктов по бренду
- `getListProductByCategoryId` - получение списка продуктов по категории
- `getAllByBrandIdAndCategoryId` - получение списка продуктов по категории и бренду

<br/>
<br/>
<br/>

### ProductPropertyController

- `createProductProperty` - создать свойство продукта
- `getProductProperty` - получить свойство продукта
- `updateProductProperty` - обновить свойство продукта
- `removeProductProperty` - удалить свойство продукта
- `getListProductProperty` - получить список свойств продукта

<br/>
<br/>
<br/>

### RatingController

- `createRating` - создание рейтинга продукта
- `getRating` - получить рейтинг продукта

<br/>
<br/>
<br/>

### RoleController

- `createRole` - создание роли
- `getRole` - получение роли
- `getListRole` - получение списка ролей

<br/>
<br/>
<br/>

### UserController

- `createUser` - создание пользователя
- `getListUsers` - получение списка пользователей
- `getUser` - получение пользователя
- `updateUser` - обновление пользователя
- `removeUser` - удаление пользователя
- `addRole` - добавить роль пользователю
- `removeRole` - удалить роль у пользователя