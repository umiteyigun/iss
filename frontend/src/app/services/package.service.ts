import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Package {
  id: number;
  name: string;
  download: string;
  upload: string;
  price: number;
  traffic: string;
  sat: string;
  tenant_id: number;
  tenant?: {
    id: number;
    name: string;
  };
}

export interface PackageResponse {
  success: boolean;
  data: {
    packages: Package[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface PackageParams {
  page?: number;
  limit?: number;
  search?: string;
  tenantId?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class PackageService {
  private apiUrl = `${environment.apiUrl}/packages`;

  constructor(private http: HttpClient) {}

  getPackages(params: PackageParams): Observable<PackageResponse> {
    let httpParams = new HttpParams();
    
    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.tenantId !== null && params.tenantId !== undefined) {
      httpParams = httpParams.set('tenantId', params.tenantId.toString());
    }

    return this.http.get<PackageResponse>(this.apiUrl, { params: httpParams });
  }

  getPackageById(id: number): Observable<{ success: boolean; data: { package: Package } }> {
    return this.http.get<{ success: boolean; data: { package: Package } }>(`${this.apiUrl}/${id}`);
  }

  createPackage(packageData: any): Observable<{ success: boolean; data?: any; error?: string }> {
    return this.http.post<{ success: boolean; data?: any; error?: string }>(this.apiUrl, packageData);
  }

  updatePackage(id: number, packageData: any): Observable<{ success: boolean; data?: any; error?: string }> {
    return this.http.put<{ success: boolean; data?: any; error?: string }>(`${this.apiUrl}/${id}`, packageData);
  }

  deletePackage(id: number): Observable<{ success: boolean; message?: string; error?: string }> {
    return this.http.delete<{ success: boolean; message?: string; error?: string }>(`${this.apiUrl}/${id}`);
  }
}
