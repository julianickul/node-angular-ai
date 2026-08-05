import { AsyncLocalStorage } from 'async_hooks';
import { AuthenticatedUser } from '@/modules/auth/interfaces/auth-request.interface';

interface RequestContextStore {
  user: AuthenticatedUser;
}

export const requestContextStorage =
  new AsyncLocalStorage<RequestContextStore>();

export function getRequestUser(): AuthenticatedUser | undefined {
  return requestContextStorage.getStore()?.user;
}
