import { applyDecorators, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

export function AdminRemoveOrderDocumentation() {
  return applyDecorators(
	ApiOperation({ summary: `Удаление заказа администратором` }),
	ApiBearerAuth('JWT-auth'),
	ApiParam({
		name: `orderId`,
		type: `string`,
		description: `идентификатор заказа`,
		required: true,
	}),
	ApiResponse({
		description: `Remove order`,
		status: HttpStatus.OK,
		schema: { title: 'Удалено записей', example: 1 },
	}),
	ApiNotFoundResponse({
		description: `Not Found`,
		status: HttpStatus.NOT_FOUND,
		schema: {
		title: `Заказ не найден`,
		example: {
			statusCode: HttpStatus.NOT_FOUND,
			url: '/online-store/order/admin/delete-order/53',
			path: '/online-store/order/admin/delete-order/53',
			name: 'NotFoundException',
			message: 'Заказ не найден',
		},
		},
	}),
  );
}
