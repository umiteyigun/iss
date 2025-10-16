import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Member {
  id: number;
  username: string;
  name: string;
  lastname: string;
  email: string;
  phone: string;
  tc: string;
  photo: string;
  is_active: boolean;
  last_login: string;
  created_at: string;
  tenant_id: number;
  tenant?: {
    id: number;
    name: string;
  };
  roles?: Role[];
}

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description: string;
  is_system_role: boolean;
  tenant_id: number;
  permissions?: Permission[];
}

export interface Permission {
  id: number;
  name: string;
  display_name: string;
  module: string;
  action: string;
  description: string;
}

export interface MembersResponse {
  success: boolean;
  data: {
    members: Member[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface RolesResponse {
  success: boolean;
  data: Role[];
}

export interface PermissionsResponse {
  success: boolean;
  data: { [module: string]: Permission[] };
}

@Injectable({
  providedIn: 'root'
})
export class MemberService {
  private apiUrl = `${environment.apiUrl}/members`;

  constructor(private http: HttpClient) {}

  // Get all members
  getMembers(page: number = 1, limit: number = 10, search: string = '', tenantId?: number): Observable<MembersResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

    if (tenantId) {
      params = params.set('tenantId', tenantId.toString());
    }

    return this.http.get<MembersResponse>(this.apiUrl, { params });
  }

  // Get single member
  getMember(id: number, tenantId?: number): Observable<{ success: boolean; data: Member }> {
    let params = new HttpParams();
    if (tenantId) {
      params = params.set('tenantId', tenantId.toString());
    }

    return this.http.get<{ success: boolean; data: Member }>(`${this.apiUrl}/${id}`, { params });
  }

  // Create member
  createMember(member: Partial<Member>): Observable<{ success: boolean; data: Member }> {
    return this.http.post<{ success: boolean; data: Member }>(this.apiUrl, member);
  }

  // Update member
  updateMember(id: number, member: any): Observable<{ success: boolean; member: Member }> {
    return this.http.put<{ success: boolean; member: Member }>(`${this.apiUrl}/${id}`, member);
  }

  // Delete member
  deleteMember(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${id}`);
  }

  // Get available roles
  getAvailableRoles(): Observable<RolesResponse> {
    return this.http.get<RolesResponse>(`${this.apiUrl}/roles`);
  }

  // Get roles (for role assignment)
  getRoles(tenantId?: number): Observable<{ success: boolean; roles: Role[] }> {
    let params = new HttpParams();
    if (tenantId !== undefined) {
      params = params.set('tenantId', tenantId.toString());
    }
    return this.http.get<{ success: boolean; roles: Role[] }>(`${this.apiUrl}/roles`, { params });
  }

  // Get permissions grouped by module
  getPermissionsGrouped(): Observable<PermissionsResponse> {
    return this.http.get<PermissionsResponse>(`${this.apiUrl}/permissions/grouped`);
  }

  // Create role
  createRole(role: Partial<Role>): Observable<{ success: boolean; data: Role }> {
    return this.http.post<{ success: boolean; data: Role }>(`${this.apiUrl}/roles`, role);
  }

  // Update role
  updateRole(id: number, role: Partial<Role>): Observable<{ success: boolean; data: Role }> {
    return this.http.put<{ success: boolean; data: Role }>(`${this.apiUrl}/roles/${id}`, role);
  }

  // Delete role
  deleteRole(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/roles/${id}`);
  }

  // Get member permissions
  getMemberPermissions(id: number): Observable<{ success: boolean; data: Permission[] }> {
    return this.http.get<{ success: boolean; data: Permission[] }>(`${this.apiUrl}/${id}/permissions`);
  }
}
