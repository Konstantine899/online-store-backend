interface IAuthDto {
    email: string;
    password: string;
}

export type TLogin = IAuthDto;
export type TRegistration = IAuthDto;
