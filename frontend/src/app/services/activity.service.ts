import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface RecentSession {
  radacctid: number;
  username: string;
  nasipaddress: string;
  framedipaddress: string | null;
  acctstarttime: string | null;
  acctstoptime: string | null;
  acctsessiontime: number | null;
  acctterminatecause: string | null;
  acctinputoctets: number;
  acctoutputoctets: number;
  callingstationid: string | null;
  calledstationid: string | null;
  nasportid: string | null;
  nasporttype: string | null;
  tenant_id: number | null;
  tenant_name: string | null;
}

export interface ActivityUser {
  id: number;
  username: string;
  tenant_id: number | null;
  regdate: string | null;
  tenant?: {
    name: string;
  };
}

export interface UserHistoryItem {
  radacctid: number;
  acctstarttime: string | null;
  acctstoptime: string | null;
  acctsessiontime: number | null;
  framedipaddress: string | null;
  nasipaddress: string | null;
  acctterminatecause: string | null;
  upload_octets: number;
  download_octets: number;
}

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private baseUrl = '/api/activity';

  constructor(private http: HttpClient) {}

  getRecentSessions(page = 1, limit = 25, search = '', tenantFilter = ''): Observable<{ success: boolean; data: { sessions: RecentSession[]; pagination: Pagination } }> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    if (tenantFilter) params = params.set('tenant', tenantFilter);
    return this.http.get<{ success: boolean; data: { sessions: RecentSession[]; pagination: Pagination } }>(`${this.baseUrl}/recent-sessions`, { params });
  }

  getUsers(page = 1, limit = 25, search = '', tenantFilter = ''): Observable<{ success: boolean; data: { users: ActivityUser[]; pagination: Pagination } }> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    if (tenantFilter) params = params.set('tenant', tenantFilter);
    return this.http.get<{ success: boolean; data: { users: ActivityUser[]; pagination: Pagination } }>(`${this.baseUrl}/users`, { params });
  }

  getTenants(): Observable<{ success: boolean; data: { tenants: any[] } }> {
    return this.http.get<{ success: boolean; data: { tenants: any[] } }>(`${this.baseUrl}/tenants`);
  }

  getUserHistory(username: string, limit = 10): Observable<{ success: boolean; data: { username: string; history: UserHistoryItem[] } }> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<{ success: boolean; data: { username: string; history: UserHistoryItem[] } }>(`${this.baseUrl}/users/${encodeURIComponent(username)}/history`, { params });
  }
}


