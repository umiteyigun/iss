import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  expiredUsers: number;
  onlineUsers: number;
  totalNas: number;
  onlineNas: number;
  totalMembers: number;
  totalTenants?: number;
  activeTenants?: number;
}


export interface SystemHealth {
  nasDevices: Array<{
    id: number;
    nasname: string;
    status: string;
  }>;
}

export interface UserStatus {
  online: number;
  offline: number;
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  getStats(tenantId?: number | null): Observable<{ success: boolean; data: DashboardStats }> {
    const params = tenantId !== undefined ? `?tenantId=${tenantId?.toString() || 'null'}` : '';
    return this.http.get<{ success: boolean; data: DashboardStats }>(`${this.apiUrl}/dashboard/stats${params}`);
  }


  getHealth(): Observable<{ success: boolean; data: SystemHealth }> {
    return this.http.get<{ success: boolean; data: SystemHealth }>(`${this.apiUrl}/dashboard/health`);
  }

  getNetworkTraffic(tenantId?: number | null, nasDeviceId?: number, interfaceName?: string): Observable<{ success: boolean; data: any }> {
    const params = new URLSearchParams();
    if (tenantId !== undefined) {
      params.append('tenantId', tenantId?.toString() || 'null');
    }
    if (nasDeviceId) {
      params.append('nasDeviceId', nasDeviceId.toString());
    }
    if (interfaceName) {
      params.append('interface', interfaceName);
    }
    const queryString = params.toString();
    return this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/dashboard/traffic${queryString ? '?' + queryString : ''}`);
  }

  getNasDevices(tenantId?: number | null): Observable<{ success: boolean; data: any }> {
    const params = tenantId !== undefined ? `?tenantId=${tenantId?.toString() || 'null'}` : '';
    return this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/dashboard/nas-devices${params}`);
  }

  getNasInterfaces(nasDeviceId: number): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/dashboard/nas-devices/${nasDeviceId}/interfaces`);
  }

  getUserStatus(tenantId?: number | null): Observable<{ success: boolean; data: UserStatus }> {
    const params = tenantId !== undefined ? `?tenantId=${tenantId?.toString() || 'null'}` : '';
    return this.http.get<{ success: boolean; data: UserStatus }>(`${this.apiUrl}/dashboard/user-status${params}`);
  }
}
