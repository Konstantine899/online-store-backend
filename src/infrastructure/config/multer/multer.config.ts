import { BadRequestException, HttpStatus } from '@nestjs/common';
import { Express } from 'express';
import * as path from 'path';

/**
 * Список разрешённых MIME типов для изображений
 */
const ALLOWED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
];

/**
 * Список разрешённых расширений файлов
 */
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|gif)$/i;

/**
 * Максимальный размер файла: 256 KB
 */
const MAX_FILE_SIZE = 256000;

/**
 * Конфигурация Multer для безопасной загрузки файлов
 * 
 * Защита от:
 * - Path Traversal атак (../../etc/passwd)
 * - MIME type spoofing
 * - Недопустимых расширений файлов
 * - Слишком больших файлов
 */
export const multerConfig = {
    fileFilter: (
        request: Request,
        file: Express.Multer.File,
        cb: (error: Error | null, acceptFile: boolean) => void,
    ): void => {
        // 1. Санитизация имени файла (защита от path traversal)
        const basename = path.basename(file.originalname);
        
        // Проверка что basename совпадает с originalname (нет пути)
        if (basename !== file.originalname) {
            return cb(
                new BadRequestException({
                    status: HttpStatus.BAD_REQUEST,
                    message: 'Недопустимое имя файла (обнаружен путь)',
                }),
                false,
            );
        }

        // Проверка на попытки path traversal
        if (basename.includes('..') || basename.includes('/') || basename.includes('\\')) {
            return cb(
                new BadRequestException({
                    status: HttpStatus.BAD_REQUEST,
                    message: 'Недопустимое имя файла (недопустимые символы)',
                }),
                false,
            );
        }

        // 2. Проверка MIME типа (защита от spoofing)
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            return cb(
                new BadRequestException({
                    status: HttpStatus.BAD_REQUEST,
                    message: `Недопустимый тип файла. Разрешены: ${ALLOWED_MIME_TYPES.join(', ')}`,
                }),
                false,
            );
        }

        // 3. Проверка расширения файла
        if (!ALLOWED_EXTENSIONS.test(basename)) {
            return cb(
                new BadRequestException({
                    status: HttpStatus.BAD_REQUEST,
                    message: 'Разрешены только файлы изображений (jpg, jpeg, png, gif)',
                }),
                false,
            );
        }

        // 4. Все проверки пройдены
        cb(null, true);
    },
    limits: { 
        fileSize: MAX_FILE_SIZE,
        files: 1, // Максимум 1 файл за раз
    },
};
