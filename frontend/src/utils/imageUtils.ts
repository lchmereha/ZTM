/**
 * Checks if a string is a base64 encoded image.
 * @param str The string to check.
 * @returns True if it is a base64 image string.
 */
export const isBase64Image = (str?: string | null): boolean => {
  if (!str) return false;
  return str.startsWith('data:image/');
};

/**
 * Checks if a string is a valid URL.
 * @param str The string to check.
 * @returns True if it is a URL or a relative path starting with /.
 */
export const isObjectURL = (str?: string | null): boolean => {
  if (!str) return false;
  return /^https?:\/\//.test(str) || str.startsWith('/');
};

/**
 * Converts a File object to a base64 string.
 * @param file The file to convert.
 * @returns A promise that resolves to the base64 string.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Validates if a file is an image (including SVGs).
 * @param file The file to validate.
 * @returns True if it is a valid image file.
 */
export const isValidImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
  return validTypes.includes(file.type);
};
