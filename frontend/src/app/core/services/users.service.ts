import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUserResponse } from '@nnaai/shared-types';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  getUsers(): Observable<IUserResponse[]> {
    return this.http.get<IUserResponse[]>(this.baseUrl);
  }
}
