import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NasDevice {
  id: number;
  nasname: string;
  shortname?: string;
  type?: string;
  ports?: number;
  secret: string;
  server?: string;
  community?: string;
  description?: string;
  tenant_id: number;
  ruser?: string;
  naspassword?: string;
  tenant?: {
    id: number;
    name: string;
    subdomain?: string;
  };
}

export interface NasCreateRequest {
  nasname: string;
  shortname?: string;
  type?: string;
  ports?: number;
  secret: string;
  server?: string;
  community?: string;
  description?: string;
  tenant_id: number;
  ruser?: string;
  naspassword?: string;
}

export interface NasUpdateRequest {
  nasname?: string;
  shortname?: string;
  type?: string;
  ports?: number;
  secret?: string;
  server?: string;
  community?: string;
  description?: string;
  tenant_id?: number;
  ruser?: string;
  naspassword?: string;
}

export interface NasListResponse {
  success: boolean;
  data: {
    nasDevices: NasDevice[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export interface NasResponse {
  success: boolean;
  message?: string;
  data: {
    nasDevice: NasDevice;
  };
}

export interface NasStats {
  total_sessions: number;
  active_sessions: number;
  last_activity: string;
  created_at: string;
}

export interface NasStatsResponse {
  success: boolean;
  data: {
    stats: NasStats;
  };
}

export interface NasTestResult {
  reachable: boolean;
  response_time: number;
  last_tested: string;
}

export interface NasTestResponse {
  success: boolean;
  data: {
    testResult: NasTestResult;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NasService {
  private apiUrl = `${environment.apiUrl}/nas`;

  constructor(private http: HttpClient) { }

  // Get all NAS devices with pagination and filters
  getNasDevices(params: {
    page?: number;
    limit?: number;
    search?: string;
    tenant_id?: number;
    status?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Observable<NasListResponse> {
    let httpParams = new HttpParams();
    
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.tenant_id) httpParams = httpParams.set('tenant_id', params.tenant_id.toString());
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);


    return this.http.get<NasListResponse>(this.apiUrl, { params: httpParams });
  }

  // Get single NAS device by ID
  getNasDevice(id: number): Observable<NasResponse> {
    return this.http.get<NasResponse>(`${this.apiUrl}/${id}`);
  }

  // Create new NAS device
  createNasDevice(nasDevice: NasCreateRequest): Observable<NasResponse> {
    return this.http.post<NasResponse>(this.apiUrl, nasDevice);
  }

  // Update NAS device
  updateNasDevice(id: number, nasDevice: NasUpdateRequest): Observable<NasResponse> {
    return this.http.put<NasResponse>(`${this.apiUrl}/${id}`, nasDevice);
  }

  // Delete NAS device
  deleteNasDevice(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  // Get NAS device statistics
  getNasDeviceStats(id: number): Observable<NasStatsResponse> {
    return this.http.get<NasStatsResponse>(`${this.apiUrl}/${id}/stats`);
  }

  // Test NAS device connectivity
  testNasDevice(id: number): Observable<NasTestResponse> {
    return this.http.post<NasTestResponse>(`${this.apiUrl}/${id}/test`, {});
  }

  // Get Mikrotik device information
  getMikrotikInfo(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/mikrotik-info`);
  }

  // Get specific interface details
  getInterfaceDetails(id: number, interfaceName: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/interface/${interfaceName}`);
  }

  // Get IP addresses
  getIpAddresses(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/ip-addresses`);
  }

  // Get routes
  getRoutes(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/routes`);
  }

  // Get firewall rules
  getFirewallRules(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/firewall-rules`);
  }

  // Get NAT rules
  getNatRules(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/nat-rules`);
  }

  // Get DHCP server
  getDhcpServer(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/dhcp-server`);
  }

  // Get DHCP server leases
  getDhcpServerLeases(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/dhcp-server-leases`);
  }

  // Add DHCP server
  addDhcpServer(id: number, serverData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/dhcp-server`, serverData);
  }

  // Update DHCP server
  updateDhcpServer(id: number, serverId: string, serverData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/dhcp-server/${serverId}`, serverData);
  }

  // Delete DHCP server
  deleteDhcpServer(id: number, serverId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}/dhcp-server/${serverId}`);
  }

  // Get DHCP client
  getDhcpClient(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/dhcp-client`);
  }

  // Get DNS
  getDns(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/dns`);
  }

  // Update DNS
  updateDns(id: number, dnsSettings: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/dns`, dnsSettings);
  }

  // Get DNS Static Records
  getDnsStatic(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/dns-static`);
  }

  // DNS Static Records CRUD
  addDnsStaticRecord(id: number, record: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/dns-static`, record);
  }

  updateDnsStaticRecord(id: number, recordId: string, record: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/dns-static/${recordId}`, record);
  }

  deleteDnsStaticRecord(id: number, recordId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}/dns-static/${recordId}`);
  }

  // Get ARP
  getArp(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/arp`);
  }

  // Get status options
  getStatusOptions(): { value: string; label: string; class: string }[] {
    return [
      { value: 'active', label: 'Active', class: 'badge-success' },
      { value: 'inactive', label: 'Inactive', class: 'badge-secondary' },
      { value: 'maintenance', label: 'Maintenance', class: 'badge-warning' }
    ];
  }

  // Format date for display
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Get status badge class
  getStatusBadgeClass(status: string): string {
    const statusOptions = this.getStatusOptions();
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.class : 'badge-secondary';
  }

  // Get status label
  getStatusLabel(status: string): string {
    const statusOptions = this.getStatusOptions();
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  }

  // Validate IP address
  isValidIpAddress(ip: string): boolean {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  }

  // Validate port number
  isValidPort(port: number): boolean {
    return port > 0 && port <= 65535;
  }

  // IP Address CRUD operations
  addIpAddress(id: number, addressData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/ip-addresses`, addressData);
  }

  updateIpAddress(id: number, addressId: string, addressData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/ip-addresses/${addressId}`, addressData);
  }

  deleteIpAddress(id: number, addressId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/ip-addresses/${addressId}`);
  }

  // Routes CRUD operations
  addRoute(id: number, routeData: any, username?: string, password?: string): Observable<any> {
    const params = new HttpParams()
      .set('username', username || '')
      .set('password', password || '');
    return this.http.post(`${this.apiUrl}/${id}/routes`, routeData, { params });
  }

  updateRoute(id: number, routeId: string, routeData: any, username?: string, password?: string): Observable<any> {
    const params = new HttpParams()
      .set('username', username || '')
      .set('password', password || '');
    return this.http.put(`${this.apiUrl}/${id}/routes/${routeId}`, routeData, { params });
  }

  deleteRoute(id: number, routeId: string, username?: string, password?: string): Observable<any> {
    const params = new HttpParams()
      .set('username', username || '')
      .set('password', password || '');
    return this.http.delete(`${this.apiUrl}/${id}/routes/${routeId}`, { params });
  }

  // Get PPPoE Secrets
  getPppoeSecrets(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/pppoe-secrets`);
  }

  // Get PPP Profiles
  getPppProfiles(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/ppp-profiles`);
  }

  // Get Active PPP Sessions
  getActivePppSessions(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/active-ppp`);
  }

  getNeighborEntries(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/neighbor`);
  }

  // PPPoE Secrets CRUD methods
  createPppoeSecret(id: number, secretData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/pppoe-secrets`, secretData);
  }

  updatePppoeSecret(id: number, secretId: string, secretData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/pppoe-secrets/${secretId}`, secretData);
  }

  deletePppoeSecret(id: number, secretId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}/pppoe-secrets/${secretId}`);
  }

  togglePppoeSecret(id: number, secretId: string, disabled: boolean): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/pppoe-secrets/${secretId}/toggle`, { disabled });
  }
}
