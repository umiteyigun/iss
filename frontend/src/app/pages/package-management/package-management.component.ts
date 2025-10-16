import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PackageService } from '../../services/package.service';
import { TenantService } from '../../services/tenant.service';
import { AuthService } from '../../services/auth.service';

interface Package {
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

interface Tenant {
  id: number;
  name: string;
}

@Component({
  selector: 'app-package-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './package-management.component.html',
  styleUrls: ['./package-management.component.scss']
})
export class PackageManagementComponent implements OnInit {
  packages: Package[] = [];
  tenants: Tenant[] = [];
  selectedTenantId: number | null = null;
  isSuperAdmin = false;
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  
  // Search
  searchTerm = '';
  
  // Loading states
  loading = false;
  tenantsLoading = false;
  
  // Modal states
  showPackageModal = false;
  isEditingPackage = false;
  currentPackage: Package | null = null;
  packageForm: any = {};
  isPackageLoading = false;

  constructor(
    private packageService: PackageService,
    private tenantService: TenantService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.isSuperAdmin = this.authService.isSuperAdmin();
    
    if (this.isSuperAdmin) {
      this.loadTenants();
    } else {
      this.selectedTenantId = this.authService.getCurrentUser()?.tenant_id || null;
      this.loadPackages();
    }
  }

  loadTenants(): void {
    this.tenantsLoading = true;
    this.tenantService.getTenants().subscribe({
      next: (response) => {
        if (response.success) {
          this.tenants = response.data.tenants || response.data;
          // For super admin, initially show all packages
          this.loadPackages();
        }
        this.tenantsLoading = false;
      },
      error: (error) => {
        console.error('Error loading tenants:', error);
        this.tenantsLoading = false;
      }
    });
  }

  loadPackages(): void {
    this.loading = true;
    const params = {
      page: this.currentPage,
      limit: this.pageSize,
      search: this.searchTerm,
      tenantId: this.selectedTenantId
    };

    this.packageService.getPackages(params).subscribe({
      next: (response) => {
        if (response.success) {
          this.packages = response.data.packages;
          this.totalItems = response.data.pagination.total;
          this.totalPages = response.data.pagination.pages;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading packages:', error);
        this.loading = false;
      }
    });
  }

  onTenantChange(): void {
    this.currentPage = 1;
    this.loadPackages();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadPackages();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadPackages();
  }

  startAddPackage(): void {
    this.isEditingPackage = false;
    this.currentPackage = null;
    this.packageForm = {
      name: '',
      download: '',
      upload: '',
      price: 0,
      traffic: '',
      sat: '',
      tenant_id: this.selectedTenantId
    };
    this.showPackageModal = true;
  }

  startEditPackage(packageItem: Package): void {
    this.isEditingPackage = true;
    this.currentPackage = packageItem;
    this.packageForm = {
      name: packageItem.name,
      download: packageItem.download,
      upload: packageItem.upload,
      price: packageItem.price,
      traffic: packageItem.traffic,
      sat: packageItem.sat,
      tenant_id: packageItem.tenant_id
    };
    this.showPackageModal = true;
  }

  cancelPackageEdit(): void {
    this.showPackageModal = false;
    this.isEditingPackage = false;
    this.currentPackage = null;
    this.packageForm = {};
  }

  savePackage(): void {
    if (!this.packageForm.name || !this.packageForm.price) {
      alert('Package name and price are required');
      return;
    }

    this.isPackageLoading = true;

    if (this.isEditingPackage && this.currentPackage) {
      // Update existing package
      this.packageService.updatePackage(this.currentPackage.id, this.packageForm).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadPackages();
            this.cancelPackageEdit();
          } else {
            alert('Failed to update package');
          }
          this.isPackageLoading = false;
        },
        error: (error) => {
          console.error('Error updating package:', error);
          alert('Failed to update package');
          this.isPackageLoading = false;
        }
      });
    } else {
      // Create new package
      this.packageService.createPackage(this.packageForm).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadPackages();
            this.cancelPackageEdit();
          } else {
            alert('Failed to create package');
          }
          this.isPackageLoading = false;
        },
        error: (error) => {
          console.error('Error creating package:', error);
          alert('Failed to create package');
          this.isPackageLoading = false;
        }
      });
    }
  }

  deletePackage(packageItem: Package): void {
    if (confirm(`Are you sure you want to delete package "${packageItem.name}"?`)) {
      this.packageService.deletePackage(packageItem.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadPackages();
          } else {
            alert('Failed to delete package');
          }
        },
        error: (error) => {
          console.error('Error deleting package:', error);
          alert('Failed to delete package');
        }
      });
    }
  }


  formatPrice(price: number): string {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(price);
  }

  formatBandwidth(bytes: number | null): string {
    if (!bytes) return 'Unlimited';
    
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatSpeed(kbps: number | null): string {
    if (!kbps) return 'Unlimited';
    return kbps + ' kbps';
  }

}
