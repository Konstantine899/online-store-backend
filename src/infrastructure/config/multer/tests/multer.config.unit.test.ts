import { multerConfig } from '../multer.config';
import { BadRequestException } from '@nestjs/common';
import { Express } from 'express';

/**
 * Unit тесты для multerConfig
 *
 * Проверяем:
 * - Санитизацию имён файлов (path traversal protection)
 * - Проверку MIME типов
 * - Проверку расширений файлов
 * - Лимиты размера файлов
 */
describe('multerConfig', () => {
    let mockCallback: jest.Mock;

    beforeEach(() => {
        mockCallback = jest.fn();
    });

    describe('Path Traversal Protection', () => {
        it('должен отклонить файл с ../ в имени', () => {
            const mockFile = {
                originalname: '../../etc/passwd.jpg',
                mimetype: 'image/jpeg',
            } as Express.Multer.File;

            multerConfig.fileFilter({} as Request, mockFile, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                expect.any(BadRequestException),
                false,
            );
            const error = mockCallback.mock.calls[0][0] as BadRequestException;
            expect(error.message).toMatch(/недопустимое имя файла/i);
        });

        it('должен отклонить файл с абсолютным путём', () => {
            const mockFile = {
                originalname: '/etc/passwd.jpg',
                mimetype: 'image/jpeg',
            } as Express.Multer.File;

            multerConfig.fileFilter({} as Request, mockFile, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                expect.any(BadRequestException),
                false,
            );
        });

        it('должен отклонить файл с обратными слэшами (Windows)', () => {
            const mockFile = {
                originalname: '..\\..\\windows\\system32\\config.jpg',
                mimetype: 'image/jpeg',
            } as Express.Multer.File;

            multerConfig.fileFilter({} as Request, mockFile, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                expect.any(BadRequestException),
                false,
            );
        });

        it('должен принять файл с безопасным именем', () => {
            const mockFile = {
                originalname: 'safe-image.jpg',
                mimetype: 'image/jpeg',
            } as Express.Multer.File;

            multerConfig.fileFilter({} as Request, mockFile, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(null, true);
        });
    });

    describe('MIME Type Validation', () => {
        it('должен принять image/jpeg', () => {
            const mockFile = {
                originalname: 'photo.jpg',
                mimetype: 'image/jpeg',
            } as Express.Multer.File;

            multerConfig.fileFilter({} as Request, mockFile, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(null, true);
        });

        it('должен принять image/png', () => {
            const mockFile = {
                originalname: 'photo.png',
                mimetype: 'image/png',
            } as Express.Multer.File;

            multerConfig.fileFilter({} as Request, mockFile, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(null, true);
        });

        it('должен принять image/gif', () => {
            const mockFile = {
                originalname: 'animation.gif',
                mimetype: 'image/gif',
            } as Express.Multer.File;

            multerConfig.fileFilter({} as Request, mockFile, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(null, true);
        });

        it('должен отклонить application/pdf', () => {
            const mockFile = {
                originalname: 'document.pdf',
                mimetype: 'application/pdf',
            } as Express.Multer.File;

            multerConfig.fileFilter({} as Request, mockFile, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                expect.any(BadRequestException),
                false,
            );
            const error = mockCallback.mock.calls[0][0] as BadRequestException;
            expect(error.message).toMatch(/недопустимый тип файла/i);
        });

        it('должен отклонить text/html', () => {
            const mockFile = {
                originalname: 'malicious.html',
                mimetype: 'text/html',
            } as Express.Multer.File;

            multerConfig.fileFilter({} as Request, mockFile, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                expect.any(BadRequestException),
                false,
            );
        });

        it('должен отклонить application/octet-stream', () => {
            const mockFile = {
                originalname: 'binary.bin',
                mimetype: 'application/octet-stream',
            } as Express.Multer.File;

            multerConfig.fileFilter({} as Request, mockFile, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                expect.any(BadRequestException),
                false,
            );
        });
    });

    describe('Extension Validation', () => {
        it('должен принять .jpg расширение', () => {
            const mockFile = {
                originalname: 'photo.jpg',
                mimetype: 'image/jpeg',
            } as Express.Multer.File;

            multerConfig.fileFilter({} as Request, mockFile, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(null, true);
        });

        it('должен принять .jpeg расширение', () => {
            const mockFile = {
                originalname: 'photo.jpeg',
                mimetype: 'image/jpeg',
            } as Express.Multer.File;

            multerConfig.fileFilter({} as Request, mockFile, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(null, true);
        });

        it('должен принять .png расширение', () => {
            const mockFile = {
                originalname: 'photo.png',
                mimetype: 'image/png',
            } as Express.Multer.File;

            multerConfig.fileFilter({} as Request, mockFile, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(null, true);
        });

        it('должен принять .gif расширение', () => {
            const mockFile = {
                originalname: 'animation.gif',
                mimetype: 'image/gif',
            } as Express.Multer.File;

            multerConfig.fileFilter({} as Request, mockFile, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(null, true);
        });

        it('должен отклонить .exe расширение', () => {
            const mockFile = {
                originalname: 'malware.exe',
                mimetype: 'image/jpeg', // Spoofed MIME
            } as Express.Multer.File;

            multerConfig.fileFilter({} as Request, mockFile, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                expect.any(BadRequestException),
                false,
            );
        });

        it('должен отклонить .php расширение', () => {
            const mockFile = {
                originalname: 'shell.php',
                mimetype: 'image/jpeg', // Spoofed MIME
            } as Express.Multer.File;

            multerConfig.fileFilter({} as Request, mockFile, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                expect.any(BadRequestException),
                false,
            );
        });

        it('должен отклонить двойное расширение .jpg.exe', () => {
            const mockFile = {
                originalname: 'image.jpg.exe',
                mimetype: 'image/jpeg',
            } as Express.Multer.File;

            multerConfig.fileFilter({} as Request, mockFile, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                expect.any(BadRequestException),
                false,
            );
        });

        it('должен быть case-insensitive для расширений', () => {
            const mockFile = {
                originalname: 'PHOTO.JPG',
                mimetype: 'image/jpeg',
            } as Express.Multer.File;

            multerConfig.fileFilter({} as Request, mockFile, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(null, true);
        });
    });

    describe('File Size Limits', () => {
        it('должен иметь лимит размера файла 256000 bytes', () => {
            expect(multerConfig.limits.fileSize).toBe(256000);
        });

        it('должен ограничивать количество файлов до 1', () => {
            expect(multerConfig.limits.files).toBe(1);
        });
    });

    describe('Combined Validation (Defense in Depth)', () => {
        it('должен отклонить файл с правильным MIME но неправильным расширением', () => {
            const mockFile = {
                originalname: 'image.txt',
                mimetype: 'image/jpeg',
            } as Express.Multer.File;

            multerConfig.fileFilter({} as Request, mockFile, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                expect.any(BadRequestException),
                false,
            );
        });

        it('должен отклонить файл с правильным расширением но неправильным MIME', () => {
            const mockFile = {
                originalname: 'image.jpg',
                mimetype: 'application/x-executable',
            } as Express.Multer.File;

            multerConfig.fileFilter({} as Request, mockFile, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(
                expect.any(BadRequestException),
                false,
            );
        });

        it('должен принять файл только если и MIME и расширение валидны', () => {
            const mockFile = {
                originalname: 'valid-image.jpg',
                mimetype: 'image/jpeg',
            } as Express.Multer.File;

            multerConfig.fileFilter({} as Request, mockFile, mockCallback);

            expect(mockCallback).toHaveBeenCalledWith(null, true);
        });
    });
});
