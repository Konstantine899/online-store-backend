export interface IItems {
  readonly name: string;
  readonly price: number;
  readonly quantity: number;
}

export class OrderDto {
  readonly userId: number;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
  readonly comment: string;
  readonly items: IItems[];
}
