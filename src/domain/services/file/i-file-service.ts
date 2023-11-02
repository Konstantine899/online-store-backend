export interface IFileService {
    createFile(image: Express.Multer.File): Promise<string>;

    removeFile(file: string): Promise<boolean>;

    updateFile(oldFile: string, newFile: Express.Multer.File): Promise<string>;
}
