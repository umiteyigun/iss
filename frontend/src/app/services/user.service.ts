import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface User {
  id: number;
  username: string;
  password?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  package_id: number | null;
  package_name: string;
  tenant_id: number;
  is_active: number;
  created_at: string;
  updated_at: string;
  package?: {
    id: number;
    name: string;
    download: string;
    upload: string;
    price: number;
    traffic: string;
  } | null;
  tenant?: {
    id: number;
    name: string;
  };
  
  // İletişim bilgileri
  phone2?: string;
  phone3?: string;
  address?: string;
  
  // Adres bilgileri
  kil?: string;
  kilce?: string;
  mahkoy?: string;
  tcadde?: string;
  tdiskapino?: string;
  tickapino?: string;
  tpostano?: string;
  tadresno?: string;
  
  // Kimlik bilgileri
  tc?: string;
  cinsiyet?: string;
  uyruk?: string;
  dogumyeri?: string;
  dogumtarihi?: string;
  musteri_tipi?: string;
  
  // Aile bilgileri
  babaadi?: string;
  anaadi?: string;
  anakizliksoyadi?: string;
  
  // İş bilgileri
  unvan?: string;
  meslek?: string;
  vergino?: string;
  
  // Kimlik belgesi bilgileri
  pasaportno?: string;
  ciltno?: string;
  kutukno?: string;
  sayfano?: string;
  kserino?: string;
  kverildigiyer?: string;
  kverildigitarih?: string;
  
  // Teknik bilgiler
  ftipi?: string;
  osifre?: string;
  adurum?: string;
  sabitip?: string;
  atipi?: string;
  vergidairesi?: string;
  invoice_type?: number;
  ip_address?: string;
  expiration?: string;
  
  // NAT information for dynamic IPs
  private_ip?: string;
  shared_public_ip?: string;
  port_range?: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  package_id: number;
  tenant_id?: number;
}

export interface UpdateUserRequest {
  username?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  package_id?: number;
  tenant_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';

  constructor(private http: HttpClient) { }

  getUsers(page: number = 1, limit: number = 10, search: string = '', tenantId?: number): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

    if (tenantId !== undefined) {
      params = params.set('tenantId', tenantId.toString());
    }

    return this.http.get(`${this.apiUrl}/users`, { params });
  }

  getUserById(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${id}`);
  }

  createUser(userData: CreateUserRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, userData);
  }

  updateUser(id: number, userData: UpdateUserRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/${id}`, userData);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${id}`);
  }

  assignIpToUser(
    username: string,
    ipAddress: string,
    isStatic: boolean,
    options?: { sharedPublicIp?: string; portRange?: string; routerId?: number }
  ): Observable<any> {
    const body: any = { username, ipAddress, isStatic };
    if (options?.sharedPublicIp) body.sharedPublicIp = options.sharedPublicIp;
    if (options?.portRange) body.portRange = options.portRange;
    if (options?.routerId !== undefined) body.routerId = options.routerId;
    return this.http.post(`${this.apiUrl}/users/assign-ip`, body);
  }

  // Extra IP management
  getExtraIps(username: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${encodeURIComponent(username)}/extra-ips`);
  }

  addExtraIp(username: string, ip: string, routerId?: number, gateway?: string, comment?: string): Observable<any> {
    const body: any = { ip };
    if (routerId !== undefined) body.routerId = routerId;
    if (gateway !== undefined) body.gateway = gateway;
    if (comment !== undefined) body.comment = comment;
    return this.http.post(`${this.apiUrl}/users/${encodeURIComponent(username)}/extra-ips`, body);
  }

  deleteExtraIp(username: string, ip: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${encodeURIComponent(username)}/extra-ips/${encodeURIComponent(ip)}`);
  }

  // NAT mapping for dynamic mode (private + shared public)
  getNatMapping(username: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${encodeURIComponent(username)}/nat-mapping`);
  }

  // NAT status check
  getNatStatus(username: string, params?: any): Observable<any> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.http.get(`${this.apiUrl}/users/${encodeURIComponent(username)}/nat-status${queryParams}`);
  }

  // Write NAT rule to router
  writeNatRule(username: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${encodeURIComponent(username)}/write-nat`, {});
  }

  // Write NAT rule with details
  writeNatRuleWithDetails(username: string, sharedPublicIp: string, portRange: string, routerId?: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${encodeURIComponent(username)}/write-nat`, {
      sharedPublicIp,
      portRange,
      routerId
    });
  }

  getRouters(): Observable<any> {
    return this.http.get(`${this.apiUrl}/nas`);
  }
}
