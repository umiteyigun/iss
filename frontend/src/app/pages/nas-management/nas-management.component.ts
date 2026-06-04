import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { NasService, NasDevice, NasListResponse, NasCreateRequest, NasUpdateRequest } from '../../services/nas.service';
import { TenantService, Tenant } from '../../services/tenant.service';
import { AuthService } from '../../services/auth.service';
import { NasModalComponent } from '../../components/nas-modal/nas-modal.component';
import { MikrotikInfoModalComponent } from '../../components/mikrotik-info-modal/mikrotik-info-modal.component';
import { MikrotikManagementModalComponent } from '../../components/mikrotik-management-modal/mikrotik-management-modal.component';

@Component({
  selector: 'app-nas-management',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, NasModalComponent, MikrotikInfoModalComponent, MikrotikManagementModalComponent],
  templateUrl: './nas-management.component.html',
  styleUrls: ['./nas-management.component.scss']
})
export class NasManagementComponent implements OnInit, OnDestroy {
  nasDevices: NasDevice[] = [];
  tenants: Tenant[] = [];
  loading = false;
  error: string | null = null;
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;
  hasNextPage = false;
  hasPrevPage = false;
  
  // Filters
  searchTerm = '';
  tenantFilter = '';
  statusFilter = '';
  sortBy = 'id';
  sortOrder: 'ASC' | 'DESC' = 'DESC';
  
  // Search debounce
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  // Status options
  statusOptions = this.nasService.getStatusOptions();
  
  // Table columns
  columns = [
    { key: 'nasname', label: 'NAS Name', sortable: true },
    { key: 'shortname', label: 'Short Name', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'nasname', label: 'IP Address', sortable: true },
    { key: 'ports', label: 'Ports', sortable: true },
    { key: 'tenant', label: 'Tenant', sortable: false }
  ];

  // Make Math available in template
  Math = Math;

  constructor(
    private nasService: NasService,
    private tenantService: TenantService,
    public authService: AuthService,
    private router: Router
  ) {
    // Setup search debounce
    this.searchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1; // Reset to first page when searching
        this.loadNasDevices();
      });
  }

  ngOnInit(): void {
    // Check authentication
    
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    if (this.authService.isSuperAdmin()) {
      this.loadTenants();
    }
    this.loadNasDevices();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTenants(): void {
    this.tenantService.getTenants({ limit: 1000 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.tenants = response.data.tenants;
        },
        error: (error) => {
          console.error('Error loading tenants:', error);
        }
      });
  }

  loadNasDevices(): void {
    this.loading = true;
    this.error = null;

    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      search: this.searchTerm,
      tenant_id: this.tenantFilter ? parseInt(this.tenantFilter) : undefined,
      status: this.statusFilter,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };

    this.nasService.getNasDevices(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: NasListResponse) => {
          this.nasDevices = response.data.nasDevices;
          this.currentPage = response.data.pagination.currentPage;
          this.totalPages = response.data.pagination.totalPages;
          this.totalItems = response.data.pagination.totalItems;
          this.itemsPerPage = response.data.pagination.itemsPerPage;
          this.hasNextPage = response.data.pagination.hasNextPage;
          this.hasPrevPage = response.data.pagination.hasPrevPage;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading NAS devices:', error);
          this.error = 'Failed to load NAS devices. Please try again.';
          this.loading = false;
        }
      });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onTenantFilterChange(): void {
    this.currentPage = 1;
    this.loadNasDevices();
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.loadNasDevices();
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = column;
      this.sortOrder = 'ASC';
    }
    this.loadNasDevices();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadNasDevices();
    }
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.loadNasDevices();
  }

  // Modal state
  isModalOpen = false;
  modalData: any = null;
  saving = false;

  // Mikrotik info modal state
  isMikrotikModalOpen = false;
  selectedNasDevice: NasDevice | null = null;

  // Mikrotik management modal state
  isMikrotikManagementModalOpen = false;

  createNasDevice(): void {
    this.modalData = {
      mode: 'create',
      nasDevice: null
    };
    this.isModalOpen = true;
  }

  editNasDevice(nasDevice: NasDevice): void {
    this.modalData = {
      mode: 'edit',
      nasDevice: nasDevice
    };
    this.isModalOpen = true;
  }

  viewNasDevice(nasDevice: NasDevice): void {
    this.modalData = {
      mode: 'view',
      nasDevice: nasDevice
    };
    this.isModalOpen = true;
  }

  onModalClose(): void {
    this.isModalOpen = false;
    this.modalData = null;
  }

  onModalSave(nasData: any): void {
    this.saving = true;
    
    if (this.modalData.mode === 'create') {
      this.nasService.createNasDevice(nasData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.loadNasDevices();
              this.onModalClose();
            } else {
              this.error = response.message || 'Failed to create NAS device';
            }
            this.saving = false;
          },
          error: (err) => {
            console.error('Error creating NAS device:', err);
            this.error = 'Failed to create NAS device. Please try again.';
            this.saving = false;
          }
        });
    } else if (this.modalData.mode === 'edit') {
      this.nasService.updateNasDevice(this.modalData.nasDevice.id, nasData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.loadNasDevices();
              this.onModalClose();
            } else {
              this.error = response.message || 'Failed to update NAS device';
            }
            this.saving = false;
          },
          error: (err) => {
            console.error('Error updating NAS device:', err);
            this.error = 'Failed to update NAS device. Please try again.';
            this.saving = false;
          }
        });
    }
  }

  deleteNasDevice(nasDevice: NasDevice): void {
    if (confirm(`Are you sure you want to delete NAS device "${nasDevice.nasname}"? This action cannot be undone.`)) {
      this.nasService.deleteNasDevice(nasDevice.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.loadNasDevices(); // Reload the list
            } else {
              this.error = response.message || 'Failed to delete NAS device';
            }
          },
          error: (error) => {
            console.error('Error deleting NAS device:', error);
            this.error = 'Failed to delete NAS device. Please try again.';
          }
        });
    }
  }


  testNasDevice(nasDevice: NasDevice): void {
    this.nasService.testNasDevice(nasDevice.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            const result = response.data.testResult;
            const message = result.reachable 
              ? `NAS device is reachable (${result.response_time}ms)`
              : 'NAS device is not reachable';
            alert(message);
          } else {
            this.error = 'Failed to test NAS device';
          }
        },
        error: (error) => {
          console.error('Error testing NAS device:', error);
          this.error = 'Failed to test NAS device. Please try again.';
        }
      });
  }

  getStatusBadgeClass(status: string): string {
    return this.nasService.getStatusBadgeClass(status);
  }

  getStatusLabel(status: string): string {
    return this.nasService.getStatusLabel(status);
  }

  formatDate(dateString: string): string {
    return this.nasService.formatDate(dateString);
  }

  getSortIcon(column: string): string {
    if (this.sortBy !== column) return 'fa-sort';
    return this.sortOrder === 'ASC' ? 'fa-sort-up' : 'fa-sort-down';
  }

  getPaginationPages(): number[] {
    const pages: number[] = [];
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  trackByNasDeviceId(index: number, nasDevice: NasDevice): number {
    return nasDevice.id;
  }

  getTenantName(tenantId: number): string {
    const tenant = this.tenants.find(t => t.id === tenantId);
    return tenant ? tenant.name : 'Unknown Tenant';
  }

  // Mikrotik info functions
  showMikrotikInfo(nasDevice: NasDevice): void {
    this.selectedNasDevice = nasDevice;
    this.isMikrotikModalOpen = true;
  }

  onMikrotikModalClose(): void {
    this.isMikrotikModalOpen = false;
    this.selectedNasDevice = null;
  }

  // Mikrotik Management functions
  manageNasDevice(nasDevice: NasDevice): void {
    this.selectedNasDevice = nasDevice;
    this.isMikrotikManagementModalOpen = true;
  }

  onMikrotikManagementModalClose(): void {
    this.isMikrotikManagementModalOpen = false;
    this.selectedNasDevice = null;
  }

}
