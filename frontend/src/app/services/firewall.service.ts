import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FirewallRule {
  id: string;
  name: string;
  action: string;
  chain: string;
  protocol: string;
  srcAddress: string;
  dstAddress: string;
  srcPort: string;
  dstPort: string;
  comment: string;
  disabled: boolean;
  log: boolean;
}

export interface Connection {
  id: string;
  protocol: string;
  srcAddress: string;
  srcPort: string;
  dstAddress: string;
  dstPort: string;
  state: string;
  timeout: string;
  bytes: string;
  packets: string;
}

export interface Service {
  name: string;
  port: string;
  protocol: string;
  description: string;
}

export interface FirewallStats {
  filter: { total: number; enabled: number; disabled: number };
  nat: { total: number; enabled: number; disabled: number };
  mangle: { total: number; enabled: number; disabled: number };
  raw: { total: number; enabled: number; disabled: number };
  connections: { total: number; established: number; new: number; related: number };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FirewallService {
  private baseUrl = `${environment.apiUrl}/firewall`;

  constructor(private http: HttpClient) { }

  // Get firewall rules
  getRules(routerId: string, type: string = 'filter'): Observable<ApiResponse<FirewallRule[]>> {
    const params = new HttpParams()
      .set('routerId', routerId)
      .set('type', type);
    
    return this.http.get<ApiResponse<FirewallRule[]>>(`${this.baseUrl}/rules`, { params });
  }

  // Get specific firewall rule
  getRule(routerId: string, ruleId: string): Observable<ApiResponse<FirewallRule>> {
    const params = new HttpParams().set('routerId', routerId);
    return this.http.get<ApiResponse<FirewallRule>>(`${this.baseUrl}/rules/${ruleId}`, { params });
  }

  // Create new firewall rule
  createRule(routerId: string, ruleData: Partial<FirewallRule>): Observable<ApiResponse<FirewallRule>> {
    return this.http.post<ApiResponse<FirewallRule>>(`${this.baseUrl}/rules`, {
      routerId,
      ...ruleData
    });
  }

  // Update firewall rule
  updateRule(routerId: string, ruleId: string, ruleData: Partial<FirewallRule>): Observable<ApiResponse<FirewallRule>> {
    return this.http.put<ApiResponse<FirewallRule>>(`${this.baseUrl}/rules/${ruleId}`, {
      routerId,
      ...ruleData
    });
  }

  // Delete firewall rule
  deleteRule(routerId: string, ruleId: string): Observable<ApiResponse<void>> {
    const params = new HttpParams().set('routerId', routerId);
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/rules/${ruleId}`, { params });
  }

  // Toggle firewall rule (enable/disable)
  toggleRule(routerId: string, ruleId: string): Observable<ApiResponse<FirewallRule>> {
    return this.http.patch<ApiResponse<FirewallRule>>(`${this.baseUrl}/rules/${ruleId}/toggle`, {
      routerId
    });
  }

  // Get active connections
  getConnections(routerId: string): Observable<ApiResponse<Connection[]>> {
    const params = new HttpParams().set('routerId', routerId);
    return this.http.get<ApiResponse<Connection[]>>(`${this.baseUrl}/connections`, { params });
  }

  // Close specific connection
  closeConnection(routerId: string, connectionId: string): Observable<ApiResponse<void>> {
    const params = new HttpParams().set('routerId', routerId);
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/connections/${connectionId}`, { params });
  }

  // Get firewall statistics
  getStats(routerId: string): Observable<ApiResponse<FirewallStats>> {
    const params = new HttpParams().set('routerId', routerId);
    return this.http.get<ApiResponse<FirewallStats>>(`${this.baseUrl}/stats`, { params });
  }

  // Export firewall rules
  exportRules(routerId: string, type: string = 'all'): Observable<Blob> {
    const params = new HttpParams()
      .set('routerId', routerId)
      .set('type', type);
    
    return this.http.get(`${this.baseUrl}/export`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // Import firewall rules
  importRules(routerId: string, rules: any, replace: boolean = false): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/import`, {
      routerId,
      rules,
      replace
    });
  }

  // Get common service ports
  getServices(): Observable<ApiResponse<Service[]>> {
    return this.http.get<ApiResponse<Service[]>>(`${this.baseUrl}/services`);
  }

  // Helper method to download exported rules
  downloadRules(routerId: string, type: string = 'all'): void {
    this.exportRules(routerId, type).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `firewall-rules-${routerId}-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading rules:', error);
      }
    });
  }

  // Helper method to upload and import rules
  uploadRules(routerId: string, file: File, replace: boolean = false): Observable<ApiResponse<any>> {
    return new Observable(observer => {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          const rules = JSON.parse(reader.result as string);
          this.importRules(routerId, rules, replace).subscribe({
            next: (response) => observer.next(response),
            error: (error) => observer.error(error)
          });
        } catch (error) {
          observer.error(new Error('Invalid JSON file'));
        }
      };
      
      reader.onerror = () => {
        observer.error(new Error('Error reading file'));
      };
      
      reader.readAsText(file);
    });
  }
}
