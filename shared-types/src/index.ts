export * from './interfaces/user.interface';
export * from './interfaces/ticket.interface';
export * from './interfaces/ticket-history.interface';
export * from './interfaces/pagination.interface';

export * from './enums/user-role.enum';
export * from './enums/tickets.enum';

export * from './dto/requests/auth-request.dto';
export * from './dto/responses/auth-response.dto';

// Aliases for frontend convenience
export type { ILoginRequest as LoginDto } from './dto/requests/auth-request.dto';
export type { IRegisterRequest as RegisterDto } from './dto/requests/auth-request.dto';
export type { IAuthResponse as AuthResponse } from './dto/responses/auth-response.dto';
