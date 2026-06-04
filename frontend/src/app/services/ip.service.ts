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

/** ip_type: 0=static, 1=shared, 2=routed, 3=CIDR block reserve */
export const METRO_IP_TYPE_ROUTED = 2;
export const METRO_IP_TYPE_BLOCK = 3;

export interface MetroIP {
  id: number;
  nasname: string;
  ipaddress: string;
  ports: string;
  user: string;
  tenant_id: number;
  ip_type: number;
  is_block?: boolean;
  is_shared_src_pool?: boolean;
  pool_segment_count?: number;
  block_host_count?: number;
  block_label?: string;
  binding_type?: 'assigned' | 'routed';
  nat_in_use?: boolean;
  nat_local_ip?: string;
  nat_type?: 'src' | 'dst' | 'both';
  nat_src_full?: boolean;
  nat_has_src?: boolean;
  nat_has_dst?: boolean;
  nat_dst_ports?: string[];
  nat_summary?: string;
  lan_ip?: string;
  notes?: string;
}

export interface RouteMetroIpRequest {
  username: string;
  routerId: number;
  comment?: string;
  notes?: string;
}

export interface NatMetroIpRequest {
  routerId: number;
  natLocalIp: string;
  username?: string;
  natType?: 'src' | 'dst' | 'both';
  dstNatServiceMode?: 'all' | 'selected' | 'custom' | 'none';
  selectedServices?: string[];
  customNatRules?: Array<{
    protocol: 'tcp' | 'udp';
    port: string;
  }>;
  replaceExisting?: boolean;
}

export interface MetroIpNatConfig {
  hasExisting: boolean;
  natLocalIp: string;
  natType?: 'src' | 'dst' | 'both';
  dstNatServiceMode: 'all' | 'selected' | 'custom' | 'none';
  hasSrcNat?: boolean;
  hasDstNat?: boolean;
  srcNatFull?: boolean;
  srcRuleCount?: number;
  dstRuleCount?: number;
  summary?: string;
  selectedServices: string[];
  customNatRules: Array<{
    protocol: 'tcp' | 'udp';
    port: string;
  }>;
  existingRuleCount: number;
  existingPorts: string[];
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
  routerNatSync?: boolean;
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

    if (params.routerNatSync === false) {
      httpParams = httpParams.set('routerNatSync', 'false');
    }

    return this.http.get<MetroIPResponse>(`${this.apiUrl}/metroips`, { params: httpParams });
  }

  getAssignableStaticMetroIPs(params: {
    tenantId?: number | null;
    username?: string;
    currentIp?: string;
    pickerMode?: 'primary' | 'extra';
  }): Observable<{ success: boolean; data: { metroips: Array<{ value: string; display: string; type?: string; ip: string; nas?: string; ports?: string }> } }> {
    let httpParams = new HttpParams();
    if (params.tenantId !== null && params.tenantId !== undefined) {
      httpParams = httpParams.set('tenantId', params.tenantId.toString());
    }
    if (params.username) {
      httpParams = httpParams.set('username', params.username);
    }
    if (params.currentIp) {
      httpParams = httpParams.set('currentIp', params.currentIp);
    }
    if (params.pickerMode) {
      httpParams = httpParams.set('pickerMode', params.pickerMode);
    }
    return this.http.get<{ success: boolean; data: { metroips: any[] } }>(
      `${this.apiUrl}/metroips/assignable-static`,
      { params: httpParams }
    );
  }

  // Create IP Pool
  createIpPool(ipPool: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/pools`, ipPool);
  }

  // Create Metro IP (single host or block reserve)
  createMetroIP(metroIP: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/metroips`, metroIP);
  }

  createMetroIPsBulk(items: any[], tenantId?: number | null): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/metroips/bulk`, { items, tenant_id: tenantId });
  }

  // Route available metro IP to a user
  routeMetroIP(metroIpId: number, payload: RouteMetroIpRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/metroips/${metroIpId}/route`, payload);
  }

  // Clear route for a routed metro IP
  clearMetroIpRoute(metroIpId: number, routerId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/metroips/${metroIpId}/route`, {
      body: { routerId }
    });
  }

  // Read existing NAT rules/config from router for metro IP
  getMetroIpNatConfig(metroIpId: number, routerId: number): Observable<{ success: boolean; data: MetroIpNatConfig }> {
    const params = new HttpParams().set('routerId', routerId.toString());
    return this.http.get<{ success: boolean; data: MetroIpNatConfig }>(`${this.apiUrl}/metroips/${metroIpId}/nat`, { params });
  }

  // Apply NAT rules for a metro IP (independent from route)
  natMetroIP(metroIpId: number, payload: NatMetroIpRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/metroips/${metroIpId}/nat`, payload);
  }

  // Clear NAT rules for a metro IP
  clearMetroIpNat(metroIpId: number, routerId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/metroips/${metroIpId}/nat`, {
      body: { routerId }
    });
  }

  updateMetroIP(metroIpId: number, payload: { notes?: string; lan_ip?: string; user?: string }): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/metroips/${metroIpId}`, payload);
  }
}
