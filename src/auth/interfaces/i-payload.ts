export interface IPayload {
  payload: {
	type: string;
	accessToken: string;
	refreshToken?: string;
  };
}
