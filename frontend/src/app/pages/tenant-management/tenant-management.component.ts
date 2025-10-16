import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { TenantService, Tenant, TenantListResponse, TenantCreateRequest, TenantUpdateRequest } from '../../services/tenant.service';
import { AuthService } from '../../services/auth.service';
import { TenantModalComponent, TenantModalData } from '../../components/tenant-modal/tenant-modal.component';

@Component({
  selector: 'app-tenant-management',
  standalone: true,
  imports: [CommonModule, FormsModule, TenantModalComponent],
  templateUrl: './tenant-management.component.html',
  styleUrls: ['./tenant-management.component.scss']
})
export class TenantManagementComponent implements OnInit, OnDestroy {
  tenants: Tenant[] = [];
  loading = false;
  error: string | null = null;
  
  // Make Math available in template
  Math = Math;
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;
  hasNextPage = false;
  hasPrevPage = false;
  
  // Filters
  searchTerm = '';
  statusFilter = '';
  sortBy = 'created_at';
  sortOrder: 'ASC' | 'DESC' = 'DESC';
  
  // Search debounce
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  // Status options
  statusOptions = this.tenantService.getStatusOptions();
  
  // Modal state
  isModalOpen = false;
  modalData: TenantModalData | null = null;
  saving = false;
  
  // Table columns
  columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'subdomain', label: 'Subdomain', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'contact_email', label: 'Contact Email', sortable: false },
    { key: 'max_users', label: 'Max Users', sortable: true },
    { key: 'created_at', label: 'Created', sortable: true }
  ];

  constructor(
    private tenantService: TenantService,
    private authService: AuthService,
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
        this.loadTenants();
      });
  }

  ngOnInit(): void {
    // Check authentication
    
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    this.loadTenants();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTenants(): void {
    this.loading = true;
    this.error = null;

    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      search: this.searchTerm,
      status: this.statusFilter,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };

    this.tenantService.getTenants(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: TenantListResponse) => {
          this.tenants = response.data.tenants;
          this.currentPage = response.data.pagination.currentPage;
          this.totalPages = response.data.pagination.totalPages;
          this.totalItems = response.data.pagination.totalItems;
          this.itemsPerPage = response.data.pagination.itemsPerPage;
          this.hasNextPage = response.data.pagination.hasNextPage;
          this.hasPrevPage = response.data.pagination.hasPrevPage;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading tenants:', error);
          this.error = 'Failed to load tenants. Please try again.';
          this.loading = false;
        }
      });
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchTerm);
  }

  onStatusFilterChange(): void {
    this.currentPage = 1;
    this.loadTenants();
  }

  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = column;
      this.sortOrder = 'ASC';
    }
    this.loadTenants();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadTenants();
    }
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.loadTenants();
  }

  createTenant(): void {
    this.modalData = {
      mode: 'create'
    };
    this.isModalOpen = true;
  }

  editTenant(tenant: Tenant): void {
    this.modalData = {
      tenant: tenant,
      mode: 'edit'
    };
    this.isModalOpen = true;
  }

  viewTenant(tenant: Tenant): void {
    this.modalData = {
      tenant: tenant,
      mode: 'view'
    };
    this.isModalOpen = true;
  }

  deleteTenant(tenant: Tenant): void {
    if (confirm(`Are you sure you want to delete tenant "${tenant.name}"? This action cannot be undone.`)) {
      this.tenantService.deleteTenant(tenant.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.loadTenants(); // Reload the list
            } else {
              this.error = response.message || 'Failed to delete tenant';
            }
          },
          error: (error) => {
            console.error('Error deleting tenant:', error);
            this.error = 'Failed to delete tenant. Please try again.';
          }
        });
    }
  }

  onModalClose(): void {
    this.isModalOpen = false;
    this.modalData = null;
    this.saving = false;
  }

  onModalSave(data: TenantCreateRequest | TenantUpdateRequest): void {
    this.saving = true;
    this.error = null;

    const isEdit = this.modalData?.mode === 'edit';
    const tenantId = this.modalData?.tenant?.id;

    const operation = isEdit 
      ? this.tenantService.updateTenant(tenantId!, data as TenantUpdateRequest)
      : this.tenantService.createTenant(data as TenantCreateRequest);

    operation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.isModalOpen = false;
            this.modalData = null;
            this.loadTenants(); // Reload the list
          } else {
            this.error = `Failed to ${isEdit ? 'update' : 'create'} tenant`;
          }
          this.saving = false;
        },
        error: (error) => {
          console.error(`Error ${isEdit ? 'updating' : 'creating'} tenant:`, error);
          this.error = `Failed to ${isEdit ? 'update' : 'create'} tenant. Please try again.`;
          this.saving = false;
        }
      });
  }

  getStatusBadgeClass(status: string): string {
    return this.tenantService.getStatusBadgeClass(status);
  }

  getStatusLabel(status: string): string {
    return this.tenantService.getStatusLabel(status);
  }

  formatDate(dateString: string): string {
    return this.tenantService.formatDate(dateString);
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

  trackByTenantId(index: number, tenant: Tenant): number {
    return tenant.id;
  }
}
