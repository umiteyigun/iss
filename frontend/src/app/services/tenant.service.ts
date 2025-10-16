import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Tenant {
  id: number;
  name: string;
  subdomain?: string;
  status: 'active' | 'suspended' | 'pending';
  contact_email?: string;
  contact_phone?: string;
  max_users?: number;
  max_nas?: number;
  created_at: string;
  updated_at?: string;
}

export interface TenantCreateRequest {
  name: string;
  subdomain?: string;
  status?: 'active' | 'suspended' | 'pending';
  radius_secret: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  max_users?: number;
  max_nas?: number;
}

export interface TenantUpdateRequest {
  name?: string;
  subdomain?: string;
  status?: 'active' | 'suspended' | 'pending';
  radius_secret?: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
  max_users?: number;
  max_nas?: number;
}

export interface TenantListResponse {
  success: boolean;
  data: {
    tenants: Tenant[];
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

export interface TenantResponse {
  success: boolean;
  data: {
    tenant: Tenant;
  };
}

export interface TenantStats {
  total_users: number;
  total_nas: number;
  active_sessions: number;
  created_at: string;
  last_activity: string;
}

export interface TenantStatsResponse {
  success: boolean;
  data: {
    stats: TenantStats;
  };
}

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private apiUrl = `${environment.apiUrl}/tenants`;

  constructor(private http: HttpClient) { }

  // Get all tenants with pagination and filters
  getTenants(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  } = {}): Observable<TenantListResponse> {
    let httpParams = new HttpParams();
    
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);


    return this.http.get<TenantListResponse>(this.apiUrl, { params: httpParams });
  }

  // Get single tenant by ID
  getTenant(id: number): Observable<TenantResponse> {
    return this.http.get<TenantResponse>(`${this.apiUrl}/${id}`);
  }

  // Create new tenant
  createTenant(tenant: TenantCreateRequest): Observable<TenantResponse> {
    return this.http.post<TenantResponse>(this.apiUrl, tenant);
  }

  // Update tenant
  updateTenant(id: number, tenant: TenantUpdateRequest): Observable<TenantResponse> {
    return this.http.put<TenantResponse>(`${this.apiUrl}/${id}`, tenant);
  }

  // Delete tenant
  deleteTenant(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  // Get tenant statistics
  getTenantStats(id: number): Observable<TenantStatsResponse> {
    return this.http.get<TenantStatsResponse>(`${this.apiUrl}/${id}/stats`);
  }

  // Get tenant status options
  getStatusOptions(): { value: string; label: string; class: string }[] {
    return [
      { value: 'active', label: 'Active', class: 'badge-success' },
      { value: 'suspended', label: 'Suspended', class: 'badge-warning' },
      { value: 'pending', label: 'Pending', class: 'badge-info' }
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
}
