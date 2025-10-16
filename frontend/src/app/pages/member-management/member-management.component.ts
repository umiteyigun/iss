import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MemberService, Member, Role, Permission } from '../../services/member.service';
import { TenantService } from '../../services/tenant.service';

// Make Math available in template
declare var Math: any;

@Component({
  selector: 'app-member-management',
  templateUrl: './member-management.component.html',
  styleUrls: ['./member-management.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule]
})
export class MemberManagementComponent implements OnInit {
  members: Member[] = [];
  roles: Role[] = [];
  permissions: { [module: string]: Permission[] } = {};
  tenants: any[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalMembers = 0;
  totalPages = 0;
  
  // Search
  searchTerm = '';
  
  // Tenant filtering
  selectedTenantId: number | null = null;
  isSuperAdmin = false;
  
  // Loading states
  loading = false;
  rolesLoading = false;
  
  // Modal states
  showMemberModal = false;
  showRoleModal = false;
  showRoleAssignmentModal = false;
  showRoleManagementModal = false;
  isEditing = false;
  isEditingRole = false;
  assigningRoles = false;
  
  // Forms
  memberForm: FormGroup;
  roleForm: FormGroup;
  
  // Current member/role being edited
  currentMember: Member | null = null;
  currentRole: Role | null = null;
  
  // Selected permissions for role
  selectedPermissions: number[] = [];
  
  // Role assignment
  availableRoles: Role[] = [];
  selectedRoleIds: number[] = [];
  
  // Role management
  allRoles: Role[] = [];
  managingRoles = false;

  constructor(
    private memberService: MemberService,
    private tenantService: TenantService,
    private fb: FormBuilder
  ) {
    this.memberForm = this.createMemberForm();
    this.roleForm = this.createRoleForm();
  }

  ngOnInit(): void {
    this.checkUserRole();
    this.loadMembers();
    this.loadRoles();
    this.loadPermissions();
  }

  private checkUserRole(): void {
    // Get user from auth service
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
    
    // Check if user is super admin (tenant_id = 0 or null)
    this.isSuperAdmin = user.tenant_id === 0 || user.tenant_id === null;
    
    if (this.isSuperAdmin) {
      // Super admin can see all tenants
      this.loadTenants();
      this.selectedTenantId = null; // Show all tenants by default
    } else {
      // Regular admin can only see their tenant
      this.selectedTenantId = user.tenant_id;
    }
  }

  private createMemberForm(): FormGroup {
    return this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      name: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      tc: [''],
      tenant_id: ['', this.isSuperAdmin ? Validators.required : null]
    });
  }

  private createRoleForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      display_name: ['', [Validators.required]],
      description: [''],
      permissionIds: [[]]
    });
  }

  loadMembers(): void {
    this.loading = true;
    
    this.memberService.getMembers(
      this.currentPage,
      this.pageSize,
      this.searchTerm,
      this.selectedTenantId || undefined
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.members = response.data.members;
          this.totalMembers = response.data.total;
          this.totalPages = response.data.totalPages;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading members:', error);
        this.loading = false;
      }
    });
  }

  loadRoles(): void {
    this.rolesLoading = true;
    this.memberService.getAvailableRoles().subscribe({
      next: (response) => {
        if (response.success) {
          this.roles = response.data;
        }
        this.rolesLoading = false;
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.rolesLoading = false;
      }
    });
  }

  loadPermissions(): void {
    this.memberService.getPermissionsGrouped().subscribe({
      next: (response) => {
        if (response.success) {
          this.permissions = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading permissions:', error);
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadMembers();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadMembers();
  }

  loadTenants(): void {
    this.tenantService.getTenants().subscribe({
      next: (response) => {
        if (response.success) {
          this.tenants = response.data.tenants || response.data;
        }
      },
      error: (error) => {
        console.error('Error loading tenants:', error);
      }
    });
  }

  onTenantChange(value: any): void {
    this.currentPage = 1;
    
    // Handle the selected value
    if (value === null || value === 'null' || value === '') {
      this.selectedTenantId = null;
    } else {
      this.selectedTenantId = Number(value);
    }
    
    this.loadMembers();
  }

  // Member CRUD operations
  openAddMember(): void {
    this.isEditing = false;
    this.currentMember = null;
    
    // Recreate form to ensure proper validation
    this.memberForm = this.createMemberForm();
    
    // Set default tenant
    if (this.isSuperAdmin) {
      this.memberForm.patchValue({
        tenant_id: this.selectedTenantId
      });
    } else {
      // Regular admin can only create members in their tenant
      this.memberForm.patchValue({
        tenant_id: this.selectedTenantId
      });
    }
    
    this.showMemberModal = true;
  }

  openEditMember(member: Member): void {
    this.isEditing = true;
    this.currentMember = member;
    
    // Recreate form to ensure proper validation
    this.memberForm = this.createMemberForm();
    
    this.memberForm.patchValue({
      username: member.username,
      name: member.name,
      lastname: member.lastname,
      email: member.email,
      phone: member.phone,
      tc: member.tc,
      tenant_id: member.tenant_id
    });
    
    // Password is optional for edit
    this.memberForm.get('password')?.clearValidators();
    this.memberForm.get('password')?.updateValueAndValidity();
    
    this.showMemberModal = true;
  }

  saveMember(): void {
    if (this.memberForm.valid) {
      const formData = this.memberForm.value;
      
      if (this.isEditing && this.currentMember) {
        this.memberService.updateMember(this.currentMember.id, formData).subscribe({
          next: (response) => {
            if (response.success) {
              this.closeMemberModal();
              this.loadMembers();
            }
          },
          error: (error) => {
            console.error('Error updating member:', error);
          }
        });
      } else {
        this.memberService.createMember(formData).subscribe({
          next: (response) => {
            if (response.success) {
              this.closeMemberModal();
              this.loadMembers();
            }
          },
          error: (error) => {
            console.error('Error creating member:', error);
          }
        });
      }
    }
  }

  deleteMember(member: Member): void {
    if (confirm(`Are you sure you want to delete member "${member.username}"?`)) {
      this.memberService.deleteMember(member.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadMembers();
          }
        },
        error: (error) => {
          console.error('Error deleting member:', error);
        }
      });
    }
  }

  closeMemberModal(): void {
    this.showMemberModal = false;
    this.memberForm.reset();
    this.currentMember = null;
    
    // Recreate form to reset validators
    this.memberForm = this.createMemberForm();
  }

  // Role CRUD operations
  openAddRole(): void {
    this.isEditingRole = false;
    this.currentRole = null;
    this.roleForm.reset();
    this.selectedPermissions = [];
    // Close Role Management Modal when opening Role Modal
    this.showRoleManagementModal = false;
    this.showRoleModal = true;
  }

  openEditRole(role: Role): void {
    this.isEditingRole = true;
    this.currentRole = role;
    this.roleForm.patchValue({
      name: role.name,
      display_name: role.display_name,
      description: role.description
    });
    this.selectedPermissions = role.permissions?.map(p => p.id) || [];
    this.showRoleModal = true;
  }

  saveRole(): void {
    if (this.roleForm.valid) {
      const formData = {
        ...this.roleForm.value,
        permissionIds: this.selectedPermissions
      };
      
      if (this.isEditingRole && this.currentRole) {
        this.memberService.updateRole(this.currentRole.id, formData).subscribe({
          next: (response) => {
            if (response.success) {
              this.closeRoleModal();
              this.loadRoles();
              // Reload roles in management modal if it was open
              if (this.allRoles.length > 0) {
                this.loadAllRoles();
              }
            }
          },
          error: (error) => {
            console.error('Error updating role:', error);
          }
        });
      } else {
        this.memberService.createRole(formData).subscribe({
          next: (response) => {
            if (response.success) {
              this.closeRoleModal();
              this.loadRoles();
              // Reload roles in management modal if it was open
              if (this.allRoles.length > 0) {
                this.loadAllRoles();
              }
            }
          },
          error: (error) => {
            console.error('Error creating role:', error);
          }
        });
      }
    }
  }


  closeRoleModal(): void {
    this.showRoleModal = false;
    this.roleForm.reset();
    this.selectedPermissions = [];
    this.currentRole = null;
    // If we were editing from Role Management, reopen it
    if (this.isEditingRole) {
      this.openManageRoles();
    }
  }

  // Permission management
  togglePermission(permissionId: number): void {
    const index = this.selectedPermissions.indexOf(permissionId);
    if (index > -1) {
      this.selectedPermissions.splice(index, 1);
    } else {
      this.selectedPermissions.push(permissionId);
    }
  }

  isPermissionSelected(permissionId: number): boolean {
    return this.selectedPermissions.includes(permissionId);
  }

  toggleModulePermissions(module: string): void {
    const modulePermissions = this.permissions[module] || [];
    const modulePermissionIds = modulePermissions.map(p => p.id);
    
    const allSelected = modulePermissionIds.every(id => this.selectedPermissions.includes(id));
    
    if (allSelected) {
      // Remove all module permissions
      modulePermissionIds.forEach(id => {
        const index = this.selectedPermissions.indexOf(id);
        if (index > -1) {
          this.selectedPermissions.splice(index, 1);
        }
      });
    } else {
      // Add all module permissions
      modulePermissionIds.forEach(id => {
        if (!this.selectedPermissions.includes(id)) {
          this.selectedPermissions.push(id);
        }
      });
    }
  }

  isModuleFullySelected(module: string): boolean {
    const modulePermissions = this.permissions[module] || [];
    const modulePermissionIds = modulePermissions.map(p => p.id);
    return modulePermissionIds.length > 0 && modulePermissionIds.every(id => this.selectedPermissions.includes(id));
  }

  isModulePartiallySelected(module: string): boolean {
    const modulePermissions = this.permissions[module] || [];
    const modulePermissionIds = modulePermissions.map(p => p.id);
    const selectedCount = modulePermissionIds.filter(id => this.selectedPermissions.includes(id)).length;
    return selectedCount > 0 && selectedCount < modulePermissionIds.length;
  }

  // Utility methods
  getRoleNames(member: Member): string {
    return member.roles?.map(r => r.display_name).join(', ') || 'No roles';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'badge-success' : 'badge-danger';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }


  // Make Math available in template
  get Math() {
    return Math;
  }

  // Make Object available in template
  get Object() {
    return Object;
  }

  // Role Assignment Methods
  openAssignRoles(member: Member): void {
    this.currentMember = member;
    this.selectedRoleIds = member.roles ? member.roles.map(role => role.id) : [];
    this.loadAvailableRoles();
    this.showRoleAssignmentModal = true;
  }

  closeRoleAssignmentModal(): void {
    this.showRoleAssignmentModal = false;
    this.currentMember = null;
    this.selectedRoleIds = [];
    this.availableRoles = [];
  }

  loadAvailableRoles(): void {
    this.memberService.getRoles(this.selectedTenantId || undefined).subscribe({
      next: (response) => {
        if (response.success) {
          this.availableRoles = response.roles;
        }
      },
      error: (error) => {
        console.error('Error loading roles:', error);
      }
    });
  }

  isRoleAssigned(roleId: number): boolean {
    return this.selectedRoleIds.includes(roleId);
  }

  toggleRoleSelection(roleId: number): void {
    const index = this.selectedRoleIds.indexOf(roleId);
    
    if (index > -1) {
      this.selectedRoleIds.splice(index, 1);
    } else {
      this.selectedRoleIds.push(roleId);
    }
  }

  saveRoleAssignments(): void {
    if (!this.currentMember) return;

    this.assigningRoles = true;
    
    const memberData = {
      roleIds: this.selectedRoleIds
    };

    this.memberService.updateMember(this.currentMember.id, memberData).subscribe({
      next: (response) => {
        if (response.success) {
          // Update the member in the list
          const memberIndex = this.members.findIndex(m => m.id === this.currentMember!.id);
          if (memberIndex > -1) {
            this.members[memberIndex] = response.member;
          }
          
          this.closeRoleAssignmentModal();
          alert('Roles assigned successfully!');
        }
        this.assigningRoles = false;
      },
      error: (error) => {
        console.error('Error assigning roles:', error);
        alert('Failed to assign roles');
        this.assigningRoles = false;
      }
    });
  }

  // Role Management Methods
  openManageRoles(): void {
    this.showRoleManagementModal = true;
    this.loadAllRoles();
  }

  closeRoleManagementModal(): void {
    this.showRoleManagementModal = false;
    this.allRoles = [];
  }

  loadAllRoles(): void {
    this.managingRoles = true;
    this.memberService.getRoles(this.selectedTenantId || undefined).subscribe({
      next: (response) => {
        if (response.success) {
          this.allRoles = response.roles;
        }
        this.managingRoles = false;
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.managingRoles = false;
      }
    });
  }

  editRole(role: Role): void {
    this.currentRole = role;
    this.isEditingRole = true;
    this.initRoleFormWithData(role);
    // Close Role Management Modal when opening Role Modal
    this.showRoleManagementModal = false;
    this.showRoleModal = true;
  }

  initRoleFormWithData(role: Role): void {
    this.roleForm.patchValue({
      name: role.name,
      display_name: role.display_name,
      description: role.description,
      permissionIds: role.permissions ? role.permissions.map(p => p.id) : []
    });
    this.selectedPermissions = role.permissions ? role.permissions.map(p => p.id) : [];
  }

  deleteRole(role: Role): void {
    if (confirm(`Are you sure you want to delete the role "${role.display_name}"?`)) {
      this.memberService.deleteRole(role.id).subscribe({
        next: (response) => {
          if (response.success) {
            alert('Role deleted successfully!');
            this.loadAllRoles();
          } else {
            alert('Failed to delete role');
          }
        },
        error: (error) => {
          console.error('Error deleting role:', error);
          alert('Failed to delete role');
        }
      });
    }
  }
}
