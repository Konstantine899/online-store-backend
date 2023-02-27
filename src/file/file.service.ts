import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as uuid from 'uuid';

@Injectable()
export class FileService {
  async createFile(file: Express.Multer.File): Promise<string> {
    try {
      const extension = file.originalname.split('.').filter(Boolean).splice(1); // Достаю расширение файла
      const newFileName = `${uuid.v4()}.${extension}`; // генерирую новое уникальное имя имя файла
      const filePath = path.resolve(__dirname, '..', 'static'); // получаю путь к директории где храняться статические файлы
      /*Проверяю если директория хранения статических файлов не существует, то создаю ее*/
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(filePath, { recursive: true }); // создаю директорию
      }
      fs.writeFileSync(path.join(filePath, newFileName), file.buffer); // записываю файл
      return newFileName;
    } catch (error) {
      throw new HttpException(
        'Произошла ошибка при записи файла',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async removeFile(fileName: string): Promise<boolean> {
    try {
      const filePath = path.resolve(__dirname, '..', 'static');
      fs.rmSync(path.join(filePath, fileName));
      return true;
    } catch (error) {
      throw new HttpException(
        'При удалении файла в файловой системе произошла непредвиденная ошибка',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
