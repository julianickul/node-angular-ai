import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ITicket,
  ITicketCreate,
  ITicketUpdate,
  ITicketQuery,
  IPaginatedResponse,
} from '@nnaai/shared-types';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tickets`;

  getTickets(query: ITicketQuery = {}): Observable<IPaginatedResponse<ITicket>> {
    let params = new HttpParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<IPaginatedResponse<ITicket>>(this.baseUrl, { params });
  }

  getTicket(id: number): Observable<ITicket> {
    return this.http.get<ITicket>(`${this.baseUrl}/${id}`);
  }

  createTicket(dto: ITicketCreate): Observable<ITicket> {
    return this.http.post<ITicket>(this.baseUrl, dto);
  }

  updateTicket(id: number, dto: ITicketUpdate): Observable<ITicket> {
    return this.http.patch<ITicket>(`${this.baseUrl}/${id}`, dto);
  }

  deleteTicket(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
