import { Model, Optional } from 'sequelize';

// User types
export interface UserAttributes {
    id: number;
    email: string;
    password: string;
    created_at: Date;
    updated_at: Date;
}

export type UserCreationAttributes = Optional<
    UserAttributes,
    'id' | 'created_at' | 'updated_at'
>;

// Role types
export interface RoleAttributes {
    id: number;
    role: string;
    description: string;
    created_at: Date;
    updated_at: Date;
}

export type RoleCreationAttributes = Optional<
    RoleAttributes,
    'id' | 'created_at' | 'updated_at'
>;

// Category types
export interface CategoryAttributes {
    id: number;
    name: string;
    image: string;
    created_at: Date;
    updated_at: Date;
}

export type CategoryCreationAttributes = Optional<
    CategoryAttributes,
    'id' | 'created_at' | 'updated_at'
>;

// Brand types
export interface BrandAttributes {
    id: number;
    name: string;
    category_id: number;
    created_at: Date;
    updated_at: Date;
}

export type BrandCreationAttributes = Optional<
    BrandAttributes,
    'id' | 'created_at' | 'updated_at'
>;

// Product types
export interface ProductAttributes {
    id: number;
    name: string;
    price: number;
    rating: number;
    image: string;
    category_id: number;
    brand_id: number;
    created_at: Date;
    updated_at: Date;
}

export type ProductCreationAttributes = Optional<
    ProductAttributes,
    'id' | 'created_at' | 'updated_at'
>;

// Rating types
export interface RatingAttributes {
    id: number;
    rating: number;
    user_id: number;
    product_id: number;
    created_at: Date;
    updated_at: Date;
}

export type RatingCreationAttributes = Optional<
    RatingAttributes,
    'id' | 'created_at' | 'updated_at'
>;

// Product Property types
export interface ProductPropertyAttributes {
    id: number;
    name: string;
    value: string;
    product_id: number;
    created_at: Date;
    updated_at: Date;
}

export type ProductPropertyCreationAttributes = Optional<
    ProductPropertyAttributes,
    'id' | 'created_at' | 'updated_at'
>;

// Order types
export interface OrderAttributes {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    amount: number;
    status: number;
    comment?: string;
    user_id: number;
    created_at: Date;
    updated_at: Date;
}

export type OrderCreationAttributes = Optional<
    OrderAttributes,
    'id' | 'created_at' | 'updated_at'
>;

// Order Item types
export interface OrderItemAttributes {
    id: number;
    name: string;
    price: number;
    quantity: number;
    order_id: number;
    created_at: Date;
    updated_at: Date;
}

export type OrderItemCreationAttributes = Optional<
    OrderItemAttributes,
    'id' | 'created_at' | 'updated_at'
>;

// Cart types
export interface CartAttributes {
    id: number;
    created_at: Date;
    updated_at: Date;
}

export type CartCreationAttributes = Optional<
    CartAttributes,
    'id' | 'created_at' | 'updated_at'
>;

// Cart Product types
export interface CartProductAttributes {
    id: number;
    quantity: number;
    cart_id: number;
    product_id: number;
    created_at: Date;
    updated_at: Date;
}

export type CartProductCreationAttributes = Optional<
    CartProductAttributes,
    'id' | 'created_at' | 'updated_at'
>;

// User Role types
export interface UserRoleAttributes {
    id: number;
    roleId: number;
    userId: number;
    created_at: Date;
    updated_at: Date;
}

export type UserRoleCreationAttributes = Optional<
    UserRoleAttributes,
    'id' | 'created_at' | 'updated_at'
>;

// Refresh Token types
export interface RefreshTokenAttributes {
    id: number;
    is_revoked: boolean;
    expires: Date;
    user_id: number;
    created_at: Date;
    updated_at: Date;
}

export type RefreshTokenCreationAttributes = Optional<
    RefreshTokenAttributes,
    'id' | 'created_at' | 'updated_at'
>;

// Model interfaces
export interface UserModel
    extends Model<UserAttributes, UserCreationAttributes>,
        UserAttributes {}
export interface RoleModel
    extends Model<RoleAttributes, RoleCreationAttributes>,
        RoleAttributes {}
export interface CategoryModel
    extends Model<CategoryAttributes, CategoryCreationAttributes>,
        CategoryAttributes {}
export interface BrandModel
    extends Model<BrandAttributes, BrandCreationAttributes>,
        BrandAttributes {}
export interface ProductModel
    extends Model<ProductAttributes, ProductCreationAttributes>,
        ProductAttributes {}
export interface RatingModel
    extends Model<RatingAttributes, RatingCreationAttributes>,
        RatingAttributes {}
export interface ProductPropertyModel
    extends Model<ProductPropertyAttributes, ProductPropertyCreationAttributes>,
        ProductPropertyAttributes {}
export interface OrderModel
    extends Model<OrderAttributes, OrderCreationAttributes>,
        OrderAttributes {}
export interface OrderItemModel
    extends Model<OrderItemAttributes, OrderItemCreationAttributes>,
        OrderItemAttributes {}
export interface CartModel
    extends Model<CartAttributes, CartCreationAttributes>,
        CartAttributes {}
export interface CartProductModel
    extends Model<CartProductAttributes, CartProductCreationAttributes>,
        CartProductAttributes {}
export interface UserRoleModel
    extends Model<UserRoleAttributes, UserRoleCreationAttributes>,
        UserRoleAttributes {}
export interface RefreshTokenModel
    extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes>,
        RefreshTokenAttributes {}
