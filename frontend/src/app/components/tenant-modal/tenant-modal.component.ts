import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Tenant, TenantCreateRequest, TenantUpdateRequest } from '../../services/tenant.service';

export interface TenantModalData {
  tenant?: Tenant;
  mode: 'create' | 'edit' | 'view';
}

@Component({
  selector: 'app-tenant-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tenant-modal.component.html',
  styleUrls: ['./tenant-modal.component.scss']
})
export class TenantModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() data: TenantModalData | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<TenantCreateRequest | TenantUpdateRequest>();

  formData: TenantCreateRequest = {
    name: '',
    subdomain: '',
    status: 'active',
    radius_secret: '',
    description: '',
    contact_email: '',
    contact_phone: '',
    max_users: undefined,
    max_nas: undefined
  };

  isEditMode = false;
  isViewMode = false;
  errors: { [key: string]: string } = {};

  statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'pending', label: 'Pending' }
  ];

  ngOnInit(): void {
    this.initializeForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.initializeForm();
    }
  }

  private initializeForm(): void {
    
    if (this.data) {
      this.isEditMode = this.data.mode === 'edit';
      this.isViewMode = this.data.mode === 'view';
      
      if (this.data.tenant) {
        this.formData = {
          name: this.data.tenant.name,
          subdomain: this.data.tenant.subdomain || '',
          status: this.data.tenant.status,
          radius_secret: '', // Don't show existing secret
          description: '',
          contact_email: this.data.tenant.contact_email || '',
          contact_phone: this.data.tenant.contact_phone || '',
          max_users: this.data.tenant.max_users || undefined,
          max_nas: this.data.tenant.max_nas || undefined
        };
      } else {
        // Reset form for create mode
        this.resetForm();
      }
    }
  }

  onClose(): void {
    this.close.emit();
    this.resetForm();
  }

  onSave(): void {
    this.errors = {};
    
    if (!this.validateForm()) {
      return;
    }

    this.save.emit(this.formData);
  }

  private validateForm(): boolean {
    let isValid = true;

    // Required fields
    if (!this.formData.name?.trim()) {
      this.errors['name'] = 'Name is required';
      isValid = false;
    }

    if (!this.isEditMode && !this.formData.radius_secret?.trim()) {
      this.errors['radius_secret'] = 'Radius secret is required';
      isValid = false;
    }

    // Email validation
    if (this.formData.contact_email && !this.isValidEmail(this.formData.contact_email)) {
      this.errors['contact_email'] = 'Please enter a valid email address';
      isValid = false;
    }

    // Subdomain validation
    if (this.formData.subdomain && !this.isValidSubdomain(this.formData.subdomain)) {
      this.errors['subdomain'] = 'Subdomain can only contain letters, numbers, and hyphens';
      isValid = false;
    }

    // Numeric validation
    if (this.formData.max_users && (this.formData.max_users < 1 || this.formData.max_users > 10000)) {
      this.errors['max_users'] = 'Max users must be between 1 and 10000';
      isValid = false;
    }

    if (this.formData.max_nas && (this.formData.max_nas < 1 || this.formData.max_nas > 1000)) {
      this.errors['max_nas'] = 'Max NAS devices must be between 1 and 1000';
      isValid = false;
    }

    return isValid;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidSubdomain(subdomain: string): boolean {
    const subdomainRegex = /^[a-zA-Z0-9-]+$/;
    return subdomainRegex.test(subdomain);
  }

  private resetForm(): void {
    this.formData = {
      name: '',
      subdomain: '',
      status: 'active',
      radius_secret: '',
      description: '',
      contact_email: '',
      contact_phone: '',
      max_users: undefined,
      max_nas: undefined
    };
    this.errors = {};
  }

  getTitle(): string {
    if (this.isViewMode) return 'View Tenant';
    if (this.isEditMode) return 'Edit Tenant';
    return 'Create New Tenant';
  }

  getSaveButtonText(): string {
    if (this.isViewMode) return 'Close';
    if (this.isEditMode) return 'Update Tenant';
    return 'Create Tenant';
  }

  isFieldDisabled(field: string): boolean {
    if (this.isViewMode) return true;
    if (this.isEditMode && field === 'radius_secret') return true;
    return false;
  }
}
