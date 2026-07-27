// DTO для входа
export interface LoginDto {
  email: string;
  password: string;
}

// DTO для регистрации
export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  confirmPassword?: string; // Опционально, для валидации на клиенте
}