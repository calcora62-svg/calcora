export class FileValidationService {
  static validate(file: File, options: { maxSizeMB?: number, allowedTypes?: string[] }): string | null {
    if (options.maxSizeMB && file.size > options.maxSizeMB * 1024 * 1024) {
      return `File is too large. Maximum size is ${options.maxSizeMB}MB.`;
    }
    
    if (options.allowedTypes && options.allowedTypes.length > 0) {
      const isAllowed = options.allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', '/'));
        }
        return file.type === type;
      });
      
      if (!isAllowed) {
        return `File type not supported. Allowed types: ${options.allowedTypes.join(', ')}`;
      }
    }
    
    return null;
  }
}
