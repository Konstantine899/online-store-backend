import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as uuid from 'uuid';
import * as process from 'process';

@Injectable()
export class FileService {
  public async createFile(image: Express.Multer.File): Promise<string> {
	if (!image) {
		throw new BadRequestException({
		status: HttpStatus.BAD_REQUEST,
		message: `Поле image не должно быть пустым`,
		});
	}
	const extension = image.originalname.split('.').filter(Boolean).splice(1); // Достаю расширение файла
	const newFileName = `${uuid.v4()}.${extension}`; // генерирую новое уникальное имя файла
	const filePath =
		process.env.NODE_ENV === 'development'
		? path.resolve(__dirname, '..', '..', 'static')
		: path.resolve(__dirname, '..', 'static'); // получаю путь к директории где храняться статические файлы
	/*Проверяю если директория хранения статических файлов не существует, то создаю ее*/
	if (!fs.existsSync(filePath)) {
		fs.mkdirSync(filePath, { recursive: true }); // создаю директорию
	}
	fs.writeFileSync(path.join(filePath, newFileName), image.buffer); // записываю файл
	return newFileName;
  }

  public async removeFile(fileName: string): Promise<boolean> {
	try {
		const filePath =
		process.env.NODE_ENV === 'development'
			? path.resolve(__dirname, '..', '..', 'static')
			: path.resolve(__dirname, '..', 'static'); // получаю путь к директории где храняться статические файлы
		fs.rmSync(path.join(filePath, fileName));
		return true;
	} catch (error) {
		throw new HttpException(
		'При удалении файла в файловой системе произошла непредвиденная ошибка',
		HttpStatus.INTERNAL_SERVER_ERROR,
		);
	}
  }

  public async updateFile(
	oldFile: string,
	newFile: Express.Multer.File,
  ): Promise<string> {
	try {
		// Удаляю старый файл
		const filePath =
		process.env.NODE_ENV === 'development'
			? path.resolve(__dirname, '..', '..', 'static')
			: path.resolve(__dirname, '..', 'static'); // получаю путь к директории где храняться статические файлы
		fs.rmSync(path.join(filePath, oldFile));

		// генерирую новый файл
		const extension = newFile.originalname
		.split('.')
		.filter(Boolean)
		.splice(1);
		const newFileName = `${uuid.v4()}.${extension}`;
		fs.writeFileSync(path.join(filePath, newFileName), newFile.buffer); // записываю файл
		return newFileName;
	} catch (error) {
		throw new HttpException(
		'Произошла непредвиденная ошибка',
		HttpStatus.INTERNAL_SERVER_ERROR,
		);
	}
  }
}
