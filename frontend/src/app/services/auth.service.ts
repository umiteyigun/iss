import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      id: number;
      username: string;
      email: string;
      first_name: string;
      last_name: string;
      role: string;
      tenant_id?: number;
    };
  };
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  tenant_id?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl || 'http://localhost:3000/api';
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = this.getToken();
    const user = this.getUser();
    
    if (token && user) {
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    }
  }

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.success) {
            this.setToken(response.data.token);
            this.setUser(response.data.user);
            this.currentUserSubject.next(response.data.user);
            this.isAuthenticatedSubject.next(true);
          }
        })
      );
  }

  logout(): void {
    this.removeToken();
    this.removeUser();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  private removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  private setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  private removeUser(): void {
    localStorage.removeItem(this.userKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  hasAnyRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.role) : false;
  }

  isSuperAdmin(): boolean {
    return this.hasRole('super_admin');
  }

  isAdmin(): boolean {
    return this.hasAnyRole(['super_admin', 'admin']);
  }

  getAuthHeaders(): { [key: string]: string } {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Permission-based access control
  hasPermission(module: string, action: string): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;
    
    // Super admin has all permissions
    if (user.role === 'super_admin') return true;
    
    // For now, return true for other roles
    // TODO: Implement actual permission checking when backend provides user permissions
    return true;
  }

  hasModuleAccess(module: string): boolean {
    return this.hasPermission(module, 'view');
  }

  // Menu visibility helpers
  canViewDashboard(): boolean {
    return this.hasModuleAccess('dashboard');
  }

  canViewNAS(): boolean {
    return this.hasModuleAccess('nas');
  }

  canViewTenants(): boolean {
    return this.isSuperAdmin();
  }

  canViewUsers(): boolean {
    return this.hasModuleAccess('user') || this.hasModuleAccess('users');
  }

  canViewMembers(): boolean {
    return this.hasModuleAccess('member') || this.hasModuleAccess('members');
  }

  canViewSettings(): boolean {
    return this.hasModuleAccess('settings');
  }

  canViewLogs(): boolean {
    return this.hasModuleAccess('logs');
  }

  canViewBtkLogs(): boolean {
    return this.canViewUsers() || this.isSuperAdmin();
  }
}
