import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BtkLogExport {
  id: number;
  tenant_id: number;
  tenant_name?: string;
  hour_start: string;
  hour_end: string;
  hour_start_display?: string;
  hour_end_display?: string;
  filename: string;
  record_count: number;
  content_sha256: string;
  sign_algorithm: string;
  signed_at: string;
  signed_at_display?: string;
  signed_at_timezone?: string;
  clock_drift_ms?: number;
  signed_at_authority?: string;
  has_zip: boolean;
  nat_fallback_count?: number;
  nat_changes_in_hour?: number;
  nat_resolution?: string;
  nat_ok?: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class BtkLogsService {
  private baseUrl = '/api/btk-logs';

  constructor(private http: HttpClient) {}

  list(page = 1, limit = 25, tenantId?: number, from?: string, to?: string): Observable<any> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (tenantId) params = params.set('tenantId', tenantId);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    return this.http.get(this.baseUrl, { params });
  }

  downloadZip(id: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}/${id}/download`, {
      responseType: 'blob',
      observe: 'response'
    });
  }

  getTimeStatus(): Observable<any> {
    return this.http.get(`${this.baseUrl}/time-status`);
  }

  verify(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}/verify`);
  }

  runExport(force = false): Observable<any> {
    return this.http.post(`${this.baseUrl}/run`, { force });
  }
}
