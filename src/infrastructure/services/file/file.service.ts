import { ConflictException, HttpStatus, Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { readdir } from 'fs/promises';
import * as uuid from 'uuid';
import * as process from 'process';
import { IFileService } from '@app/domain/services';

@Injectable()
export class FileService implements IFileService {
    public async createFile(image: Express.Multer.File): Promise<string> {
        const filePath = await this.getFilePath();
        console.log(filePath);
        return this.generateFile(filePath, image);
    }

    public async removeFile(file: string): Promise<boolean> {
        const filePath = await this.getFilePath();
        const files = await readdir(filePath); // Получаю все файлы с файловой системы
        const filenameToDelete = path.parse(file).name; // Получаю имя удаляемого
        for (const file of files) {
            const fileName = path.parse(file).name;
            if (filenameToDelete === fileName) {
                fs.rmSync(path.join(filePath, file)); //Удаляю файл из файловой системы
                return true;
            }
        }
        /*Если файл не найден в файловой системе, то просто возвращаю true для того что бы без проблем можно было удалить продукт*/
        return true;
    }

    public async updateFile(
        oldFile: string,
        newFile: Express.Multer.File,
    ): Promise<string> {
        const filePath = await this.getFilePath();
        const files = await readdir(filePath); // Получаю все файлы с файловой системы
        const filenameToDelete = path.parse(oldFile).name; // Получаю имя старого файла
        for (const file of files) {
            const fileName = path.parse(file).name;
            if (filenameToDelete === fileName) {
                fs.rmSync(path.join(filePath, oldFile)); //Удаляю файл из файловой системы
                // генерирую новый файл
                return this.generateFile(filePath, newFile);
            }
        }

        /*Если по какой-то причине файл в файловой системе отсутствует, то генерирую новый файл*/
        return this.generateFile(filePath, newFile);
    }

    private async getFilePath(): Promise<string> {
        const filePath =
            process.env.NODE_ENV === 'development'
                ? path.join(__dirname, '..', '..', '..', 'static')
                : null; // получаю путь к директории где хранятся статические файлы
        /*Проверяю если директория хранения статических файлов не существует, то создаю ее*/
        if (!fs.existsSync(filePath)) {
            fs.mkdirSync(filePath, { recursive: true }); // создаю директорию
        }
        return filePath;
    }

    private async generateFile(
        filePath: string,
        newFile: Express.Multer.File,
    ): Promise<string> {
        const extension = newFile.originalname
            .split('.')
            .filter(Boolean)
            .splice(1);
        const newFileName = `${uuid.v4()}.${extension}`;
        fs.writeFile(
            path.join(filePath, newFileName),
            newFile.buffer,
            (error) => {
                if (error) {
                    throw new ConflictException({
                        status: HttpStatus.CONFLICT,
                        message:
                            'Произошел конфликт при записи файла в файловую систему',
                    });
                }
            },
        );
        return newFileName;
    }
}
