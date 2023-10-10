import { HttpException, HttpStatus } from '@nestjs/common';

export class CustomValidationException extends HttpException {
    messages;

    constructor(response) {
        super(response, HttpStatus.BAD_REQUEST);
        this.messages = response;
    }
}
