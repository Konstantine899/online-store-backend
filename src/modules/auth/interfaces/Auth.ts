export interface Auth {
    type: string;
    accessToken: string;
    refreshToken?: string;
}
