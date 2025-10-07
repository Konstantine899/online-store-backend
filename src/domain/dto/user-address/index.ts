export interface ICreateUserAddressDto {
    readonly title: string;
    readonly street: string;
    readonly house: string;
    readonly apartment?: string;
    readonly city: string;
    readonly postal_code?: string;
    readonly country?: string;
    readonly is_default?: boolean;
}

export interface IUpdateUserAddressDto {
    readonly title?: string;
    readonly street?: string;
    readonly house?: string;
    readonly apartment?: string;
    readonly city?: string;
    readonly postal_code?: string;
    readonly country?: string;
    readonly is_default?: boolean;
}


