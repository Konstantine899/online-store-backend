import { createParamDecorator } from '@nestjs/common';

export const TransactionDecorator: () => ParameterDecorator = () => {
  return createParamDecorator((_data, request) => {
    return request.transaction;
  });
};
