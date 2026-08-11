import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ITicketHistoryStats } from '@nnaai/shared-types';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class TicketHistoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/ticket-history`;

  getStats(days = 30, recentLimit = 20): Observable<ITicketHistoryStats> {
    const params = new HttpParams()
      .set('days', String(days))
      .set('recentLimit', String(recentLimit));

    return this.http.get<ITicketHistoryStats>(`${this.baseUrl}/stats`, { params });
  }
}
