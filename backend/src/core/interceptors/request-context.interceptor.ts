import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthenticatedUser } from '@/modules/auth/interfaces/auth-request.interface';
import { requestContextStorage } from '@/core/context/request-context.storage';

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const user = context.switchToHttp().getRequest().user as
      | AuthenticatedUser
      | undefined;

    if (!user) {
      return next.handle();
    }

    return new Observable((observer) => {
      requestContextStorage.run({ user }, () => {
        next.handle().subscribe(observer);
      });
    });
  }
}
