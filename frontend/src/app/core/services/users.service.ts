import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUserCreate, IUserResponse, IUserUpdate } from '@nnaai/shared-types';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/users`;

  getUsers(): Observable<IUserResponse[]> {
    return this.http.get<IUserResponse[]>(this.baseUrl);
  }

  getUser(id: number): Observable<IUserResponse> {
    return this.http.get<IUserResponse>(`${this.baseUrl}/${id}`);
  }

  createUser(dto: IUserCreate): Observable<IUserResponse> {
    return this.http.post<IUserResponse>(this.baseUrl, dto);
  }

  updateUser(id: number, dto: IUserUpdate): Observable<IUserResponse> {
    return this.http.patch<IUserResponse>(`${this.baseUrl}/${id}`, dto);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
