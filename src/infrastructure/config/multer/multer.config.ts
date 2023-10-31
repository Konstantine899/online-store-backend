import { BadRequestException, HttpStatus } from '@nestjs/common';
import { Express } from 'express';

export const multerConfig = {
    fileFilter: (
        request: Request,
        image: Express.Multer.File,
        cb: any,
    ): void => {
        if (image.originalname.match(/(jpg|jpeg|png|gif)$/)) {
            cb(null, true);
        } else {
            cb(
                new BadRequestException({
                    status: HttpStatus.BAD_REQUEST,
                    message: 'разрешены только файлы изображений',
                }),
                false,
            );
        }
    },
    limits: { fileSize: 256000 },
};
