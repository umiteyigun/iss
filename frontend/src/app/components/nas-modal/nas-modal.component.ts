import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { NasDevice, NasCreateRequest, NasUpdateRequest } from '../../services/nas.service';
import { Tenant } from '../../services/tenant.service';

export interface NasModalData {
  nasDevice?: NasDevice;
  mode: 'create' | 'edit' | 'view';
}

@Component({
  selector: 'app-nas-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './nas-modal.component.html',
  styleUrls: ['./nas-modal.component.scss']
})
export class NasModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() data: NasModalData | null = null;
  @Input() tenants: Tenant[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<NasCreateRequest | NasUpdateRequest>();

  formData: NasCreateRequest = {
    nasname: '',
    shortname: '',
    type: 'other',
    ports: 0,
    secret: '',
    server: '',
    community: '',
    description: '',
    tenant_id: 0,
    ruser: 'admin',
    naspassword: ''
  };

  isEditMode = false;
  isViewMode = false;
  saving = false;
  errors: { [key: string]: string } = {};

  typeOptions = [
    { value: 'other', label: 'Other' },
    { value: 'cisco', label: 'Cisco' },
    { value: 'juniper', label: 'Juniper' },
    { value: 'mikrotik', label: 'Mikrotik' },
    { value: 'fortinet', label: 'Fortinet' }
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

      if (this.data.nasDevice) {
        this.formData = {
          nasname: this.data.nasDevice.nasname || '',
          shortname: this.data.nasDevice.shortname || '',
          type: this.data.nasDevice.type || 'other',
          ports: this.data.nasDevice.ports || 0,
          secret: '', // Don't show existing secret
          server: this.data.nasDevice.server || '',
          community: this.data.nasDevice.community || '',
          description: this.data.nasDevice.description || '',
          tenant_id: this.data.nasDevice.tenant_id || 0,
          ruser: this.data.nasDevice.ruser || 'admin',
          naspassword: '' // Don't show existing password
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
    this.validateForm();
    if (Object.keys(this.errors).length > 0) {
      return;
    }
    this.save.emit(this.formData);
  }

  private resetForm(): void {
    this.formData = {
      nasname: '',
      shortname: '',
      type: 'other',
      ports: 0,
      secret: '',
      server: '',
      community: '',
      description: '',
      tenant_id: 0,
      ruser: 'admin',
      naspassword: ''
    };
    this.errors = {};
  }

  getTitle(): string {
    if (this.isViewMode) return 'View NAS Device';
    if (this.isEditMode) return 'Edit NAS Device';
    return 'Create New NAS Device';
  }

  validateForm(): void {
    this.errors = {};
    
    if (!this.formData.nasname) {
      this.errors['nasname'] = 'NAS name is required.';
    }
    
    if (!this.formData.secret && !this.isEditMode) { // Only required for create
      this.errors['secret'] = 'Secret is required.';
    }
    
    if (!this.formData.tenant_id) {
      this.errors['tenant_id'] = 'Tenant is required.';
    }
    
    if (this.formData.ports !== undefined && (isNaN(this.formData.ports) || this.formData.ports < 0)) {
      this.errors['ports'] = 'Ports must be a non-negative number.';
    }
  }

  getTenantName(tenantId: number): string {
    const tenant = this.tenants.find(t => t.id === tenantId);
    return tenant ? tenant.name : 'Unknown Tenant';
  }
}
