import { BadRequestException, HttpStatus } from '@nestjs/common';

export const imageMulterOptions = {
    fileFilter: (request: Request, image: Express.Multer.File, cb: any) => {
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
