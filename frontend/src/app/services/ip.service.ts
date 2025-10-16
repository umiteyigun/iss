import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface IpPool {
  id: number;
  pool_name: string;
  nasname: string;
  framedipaddress: string;
  nasipaddress: string;
  calledstationid: string;
  callingstationid: string;
  expiry_time: string | null;
  username: string;
  pool_key: string;
  port: string;
}

export interface MetroIP {
  id: number;
  nasname: string;
  ipaddress: string;
  ports: string;
  user: string;
  tenant_id: number;
  ip_type: number;
}

export interface IpPoolParams {
  page: number;
  limit: number;
  search?: string;
  tenantId?: number | null;
}

export interface MetroIPParams {
  page: number;
  limit: number;
  search?: string;
  tenantId?: number | null;
  metroIpFilter?: string;
  ipAddressFilter?: string;
  nasNameFilter?: string;
}

export interface IpPoolResponse {
  success: boolean;
  data: {
    pools: IpPool[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface MetroIPResponse {
  success: boolean;
  data: {
    metroips: MetroIP[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class IpService {
  private apiUrl = `${environment.apiUrl}/ip`;

  constructor(private http: HttpClient) {}

  // IP Pool Management
  getIpPools(params: IpPoolParams): Observable<IpPoolResponse> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('limit', params.limit.toString());

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }

    if (params.tenantId !== null && params.tenantId !== undefined) {
      httpParams = httpParams.set('tenantId', params.tenantId.toString());
    }

    return this.http.get<IpPoolResponse>(`${this.apiUrl}/pools`, { params: httpParams });
  }

  // MetroIP Management
  getMetroIPs(params: MetroIPParams): Observable<MetroIPResponse> {
    let httpParams = new HttpParams()
      .set('page', params.page.toString())
      .set('limit', params.limit.toString());

    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }

    if (params.tenantId !== null && params.tenantId !== undefined) {
      httpParams = httpParams.set('tenantId', params.tenantId.toString());
    }

    if (params.metroIpFilter) {
      httpParams = httpParams.set('metroIpFilter', params.metroIpFilter);
    }

    if (params.ipAddressFilter) {
      httpParams = httpParams.set('ipAddressFilter', params.ipAddressFilter);
    }

    if (params.nasNameFilter) {
      httpParams = httpParams.set('nasNameFilter', params.nasNameFilter);
    }

    return this.http.get<MetroIPResponse>(`${this.apiUrl}/metroips`, { params: httpParams });
  }

  // Create IP Pool
  createIpPool(ipPool: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/pools`, ipPool);
  }

  // Create Metro IP
  createMetroIP(metroIP: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/metroips`, metroIP);
  }
}
