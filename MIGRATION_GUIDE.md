# Миграционный гайд: V1 → V2 пагинация продуктов

## Обзор изменений

Все endpoints для работы с продуктами были обновлены до версии V2 с новым форматом пагинации `{ data, meta }`.

## Изменения в API

### Удаленные endpoints (V1)

❌ **Больше не доступны:**
- `GET /online-store/product/all`
- `GET /online-store/product/all/brandId/:brandId`
- `GET /online-store/product/all/categoryId/:categoryId`
- `GET /online-store/product/all/brandId/:brandId/categoryId/:categoryId`

### Новые endpoints (V2)

✅ **Используйте новые:**
- `GET /online-store/product/list-v2`
- `GET /online-store/product/brand/{brandId}/list-v2`
- `GET /online-store/product/category/{categoryId}/list-v2`
- `GET /online-store/product/brand/{brandId}/category/{categoryId}/list-v2`

## Изменения в формате ответа

### Старый формат (V1)
```json
{
  "products": [
    {
      "id": 1,
      "name": "iPhone 15",
      "price": 999.99,
      "rating": 4.5,
      "image": "iphone15.jpg",
      "category_id": 1,
      "brand_id": 1
    }
  ],
  "totalCount": 10,
  "lastPage": 2,
  "currentPage": 1,
  "nextPage": 2,
  "previousPage": null,
  "limit": 5
}
```

### Новый формат (V2)
```json
{
  "data": [
    {
      "id": 1,
      "name": "iPhone 15",
      "price": 999.99,
      "rating": 4.5,
      "image": "iphone15.jpg",
      "category_id": 1,
      "brand_id": 1
    }
  ],
  "meta": {
    "totalCount": 10,
    "lastPage": 2,
    "currentPage": 1,
    "nextPage": 2,
    "previousPage": null,
    "limit": 5
  }
}
```

## Изменения в параметрах запроса

### Старые параметры (V1)
- `page` - номер страницы
- `limit` - количество элементов на странице

### Новые параметры (V2)
- `search` (required) - поиск по имени продукта
- `sort` (required) - сортировка цены (`asc` или `desc`)
- `page` (optional) - номер страницы (по умолчанию: 1)
- `size` (optional) - количество элементов на странице (по умолчанию: 5)

## Примеры миграции кода

### JavaScript/TypeScript

#### До (V1)
```typescript
// Старый код
const response = await fetch('/online-store/product/all?page=1&limit=5');
const data = await response.json();

const products = data.products;
const totalCount = data.totalCount;
const currentPage = data.currentPage;
```

#### После (V2)
```typescript
// Новый код
const response = await fetch('/online-store/product/list-v2?search=&sort=desc&page=1&size=5');
const data = await response.json();

const products = data.data;
const totalCount = data.meta.totalCount;
const currentPage = data.meta.currentPage;
```

### React компонент

#### До (V1)
```tsx
const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (page = 1) => {
    const response = await fetch(`/online-store/product/all?page=${page}&limit=5`);
    const data = await response.json();
    
    setProducts(data.products);
    setPagination({
      totalCount: data.totalCount,
      currentPage: data.currentPage,
      lastPage: data.lastPage
    });
  };

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
      <Pagination 
        currentPage={pagination.currentPage}
        totalPages={pagination.lastPage}
        onPageChange={fetchProducts}
      />
    </div>
  );
};
```

#### После (V2)
```tsx
const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({});
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('desc');

  useEffect(() => {
    fetchProducts();
  }, [search, sort]);

  const fetchProducts = async (page = 1) => {
    const response = await fetch(
      `/online-store/product/list-v2?search=${search}&sort=${sort}&page=${page}&size=5`
    );
    const data = await response.json();
    
    setProducts(data.data);
    setMeta(data.meta);
  };

  return (
    <div>
      <SearchInput value={search} onChange={setSearch} />
      <SortSelect value={sort} onChange={setSort} />
      
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
      
      <Pagination 
        currentPage={meta.currentPage}
        totalPages={meta.lastPage}
        onPageChange={fetchProducts}
      />
    </div>
  );
};
```

## Важные изменения

### 1. Исправлен баг с `page=0`
- **Проблема**: В V1 параметр `page=0` вызывал SQL ошибку
- **Решение**: В V2 параметр `page=0` автоматически корректируется до `page=1`

### 2. Обязательные параметры
- `search` и `sort` теперь обязательные параметры
- Если не указаны, вернется ошибка 400

### 3. Универсальный формат
- Все endpoints используют единый формат `{ data, meta }`
- Упрощает обработку ответов на фронтенде

## Проверка миграции

### 1. Проверьте все запросы к продуктам
```bash
# Найдите все места использования старых endpoints
grep -r "/online-store/product/all" src/
```

### 2. Обновите типы TypeScript
```typescript
// Старый тип
interface ProductListResponse {
  products: Product[];
  totalCount: number;
  currentPage: number;
  lastPage: number;
  nextPage: number;
  previousPage: number | null;
  limit: number;
}

// Новый тип
interface ProductListV2Response {
  data: Product[];
  meta: {
    totalCount: number;
    currentPage: number;
    lastPage: number;
    nextPage: number;
    previousPage: number | null;
    limit: number;
  };
}
```

### 3. Обновите тесты
```typescript
// Старый тест
expect(response.products).toHaveLength(5);
expect(response.totalCount).toBe(10);

// Новый тест
expect(response.data).toHaveLength(5);
expect(response.meta.totalCount).toBe(10);
```

## Поддержка

Если у вас возникли вопросы по миграции, обратитесь к:
- Swagger документации: http://localhost:5000/online-store/docs
- README.md проекта
- Команде разработки

## Временная шкала

- **V1 endpoints удалены**: Сразу после релиза
- **V2 endpoints доступны**: Сейчас
- **Рекомендуется мигрировать**: В течение 1-2 недель

---

**Важно**: Старые V1 endpoints больше не поддерживаются. Обязательно обновите код до использования V2 endpoints.
