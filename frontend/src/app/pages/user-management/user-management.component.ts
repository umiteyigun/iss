import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UserService, User } from '../../services/user.service';
import { TenantService } from '../../services/tenant.service';
import { PackageService } from '../../services/package.service';
import { IpService } from '../../services/ip.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, TranslateModule]
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  tenants: any[] = [];
  packages: any[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalUsers = 0;
  totalPages = 0;
  
  // Search
  searchTerm = '';
  
  // Tenant filtering
  selectedTenantId: number | null = null;
  isSuperAdmin = false;
  
  // Loading states
  loading = false;
  
  // Modal states
  showUserModal = false;
  isEditing = false;
  
  // Forms
  userForm: FormGroup;
  
  // Current user being edited
  currentUser: User | null = null;
  
  // Active tab for form
  activeTab = 'personal';
  
  // IP Address selection
  availableIps: any[] = [];
  selectedIpInfo: any = null;
  
  // NAS/Router selection
  availableRouters: any[] = [];
  selectedRouterId: number | null = null;

  // Extra IP management state
  extraIps: { ip: string; gateway?: string; router?: any }[] = [];
  newExtraIp = '';
  extraIpGateway = '';
  extraIpRouterId: number | null = null;
  loadingExtraIps = false;
  availableExtraIps: { ip: string }[] = [];
  loadingAvailableExtraIps = false;
  primaryIp = '';
  primaryIpRouter: any = null;

  // NAT status management
  showWriteNatButton = false;
  natButtonText = 'Write NAT Rule to Router';
  natSuccessMessage = '';
  natErrorMessage = '';
  loadingNatStatus = false;
  writingNat = false;

  constructor(
    private userService: UserService,
    private tenantService: TenantService,
    private packageService: PackageService,
    private ipService: IpService,
    private fb: FormBuilder,
    private translate: TranslateService,
    private languageService: LanguageService
  ) {
    this.userForm = this.createUserForm();
  }

  ngOnInit(): void {
    this.checkUserRole();
    this.loadUsers();
    this.loadPackages();
    this.loadRouters();
  }

  private checkUserRole(): void {
    // Get user from auth service
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
    
    console.log('🔍 Current user from localStorage:', user);
    
    // Check if user is super admin (tenant_id = 0 or null)
    this.isSuperAdmin = user.tenant_id === 0 || user.tenant_id === null;
    
    console.log('🔍 Is Super Admin:', this.isSuperAdmin);
    
    if (this.isSuperAdmin) {
      // Super admin can see all tenants
      this.loadTenants();
      this.selectedTenantId = null; // Show all tenants by default
      console.log('🔍 Super Admin - selectedTenantId set to null');
    } else {
      // Regular admin can only see their tenant
      this.selectedTenantId = user.tenant_id;
      console.log('🔍 Regular Admin - selectedTenantId set to:', this.selectedTenantId);
    }
  }

  private createUserForm(): FormGroup {
    return this.fb.group({
      // Temel bilgiler
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      package_id: ['', Validators.required],
      tenant_id: ['', this.isSuperAdmin ? Validators.required : null],
      
      // İletişim bilgileri
      phone2: [''],
      phone3: [''],
      address: [''],
      
      // Adres bilgileri
      kil: [''],
      kilce: [''],
      mahkoy: [''],
      tcadde: [''],
      tdiskapino: [''],
      tickapino: [''],
      tpostano: [''],
      tadresno: [''],
      
      // Kimlik bilgileri
      tc: [''],
      cinsiyet: [''],
      uyruk: [''],
      dogumyeri: [''],
      dogumtarihi: [''],
      musteri_tipi: [''],
      
      // Aile bilgileri
      babaadi: [''],
      anaadi: [''],
      anakizliksoyadi: [''],
      
      // İş bilgileri (conditional)
      unvan: [''],
      meslek: [''],
      vergino: [''],
      
      // Kimlik belgesi bilgileri (conditional)
      pasaportno: [''],
      ciltno: [''],
      kutukno: [''],
      sayfano: [''],
      kserino: [''],
      kverildigiyer: [''],
      kverildigitarih: [''],
      
      // Teknik bilgiler
      ftipi: [''],
      osifre: [''],
      adurum: [''],
      sabitip: [''],
      atipi: [''],
      vergidairesi: [''],
      invoice_type: [0],
      is_active: [1],
      ip_address: [''],
      expiration: [''],
      expirationDate: [''],
      expirationTime: ['']
    });
  }

  loadUsers(): void {
    this.loading = true;
    
    console.log('🔍 Loading users with params:', {
      currentPage: this.currentPage,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm,
      selectedTenantId: this.selectedTenantId
    });
    
    this.userService.getUsers(
      this.currentPage,
      this.pageSize,
      this.searchTerm,
      this.selectedTenantId || undefined
    ).subscribe({
      next: (response) => {
        console.log('📊 API Response:', response);
        console.log('📊 Response data:', response.data);
        console.log('📊 Users array:', response.data?.users);
        console.log('📊 Pagination:', response.data?.pagination);
        
        if (response.success) {
          this.users = response.data.users;
          this.totalUsers = response.data.pagination.total;
          this.totalPages = response.data.pagination.pages;
          console.log('✅ Users loaded:', this.users.length, 'users');
          console.log('✅ Total users:', this.totalUsers);
          console.log('✅ Total pages:', this.totalPages);
        } else {
          console.error('❌ API returned success: false');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error loading users:', error);
        this.loading = false;
      }
    });
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

  loadPackages(): void {
    this.packageService.getPackages({ page: 1, limit: 1000 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.packages = response.data.packages || [];
        }
      },
      error: (error) => {
        console.error('Error loading packages:', error);
      }
    });
  }

  loadRouters(): void {
    this.userService.getRouters().subscribe({
      next: (response) => {
        console.log('🔍 Router response:', response);
        if (response.success) {
          // Backend returns { success: true, data: { nasDevices: [...] } }
          const nasDevices = response.data?.nasDevices || response.data || [];
          console.log('🔍 NAS Devices:', nasDevices);
          console.log('🔍 Is array?', Array.isArray(nasDevices));
          
          if (Array.isArray(nasDevices)) {
            this.availableRouters = nasDevices.map((router: any) => ({
              value: router.id,
              display: `${router.shortname || router.nasname} (${router.nasname})`,
              id: router.id,
              nasname: router.nasname,
              shortname: router.shortname
            }));
          } else {
            console.error('❌ NAS Devices is not an array:', nasDevices);
            this.availableRouters = [];
          }
        }
      },
      error: (error) => {
        console.error('Error loading routers:', error);
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
    
    this.loadUsers();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadUsers();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadUsers();
  }

  // User CRUD operations
  openAddUser(): void {
    this.isEditing = false;
    this.currentUser = null;
    this.activeTab = 'personal'; // Reset to first tab
    
    // Recreate form to ensure proper validation
    this.userForm = this.createUserForm();
    
    // Set default tenant
    if (this.isSuperAdmin) {
      this.userForm.patchValue({
        tenant_id: this.selectedTenantId
      });
    } else {
      // Regular admin can only create users in their tenant
      this.userForm.patchValue({
        tenant_id: this.selectedTenantId
      });
    }
    
    this.showUserModal = true;
  }

  openEditUser(user: User): void {
    this.isEditing = true;
    this.currentUser = user;
    this.activeTab = 'personal'; // Reset to first tab
    
    // Reset NAT status
    this.loadingNatStatus = false;
    this.showWriteNatButton = false;
    this.natButtonText = 'Write NAT Rule to Router';
    this.natSuccessMessage = '';
    this.natErrorMessage = '';
    this.writingNat = false;
    
    // Debug: Check what data we received from backend
    console.log('🔍 openEditUser - User data received:', {
      username: user.username,
      ip_address: user.ip_address,
      sabitip: user.sabitip,
      private_ip: user.private_ip,
      shared_public_ip: user.shared_public_ip,
      port_range: user.port_range
    });
    
    // Recreate form to ensure proper validation
    this.userForm = this.createUserForm();
    
    this.userForm.patchValue({
      // Temel bilgiler
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone,
      package_id: user.package_id,
      tenant_id: user.tenant_id,
      
      // İletişim bilgileri
      phone2: user.phone2 || '',
      phone3: user.phone3 || '',
      address: user.address || '',
      
      // Adres bilgileri
      kil: user.kil || '',
      kilce: user.kilce || '',
      mahkoy: user.mahkoy || '',
      tcadde: user.tcadde || '',
      tdiskapino: user.tdiskapino || '',
      tickapino: user.tickapino || '',
      tpostano: user.tpostano || '',
      tadresno: user.tadresno || '',
      
      // Kimlik bilgileri
      tc: user.tc || '',
      cinsiyet: user.cinsiyet || '',
      uyruk: user.uyruk || '',
      dogumyeri: user.dogumyeri || '',
      dogumtarihi: user.dogumtarihi || '',
      musteri_tipi: user.musteri_tipi || '',
      
      // Aile bilgileri
      babaadi: user.babaadi || '',
      anaadi: user.anaadi || '',
      anakizliksoyadi: user.anakizliksoyadi || '',
      
      // İş bilgileri
      unvan: user.unvan || '',
      meslek: user.meslek || '',
      vergino: user.vergino || '',
      
      // Kimlik belgesi bilgileri
      pasaportno: user.pasaportno || '',
      ciltno: user.ciltno || '',
      kutukno: user.kutukno || '',
      sayfano: user.sayfano || '',
      kserino: user.kserino || '',
      kverildigiyer: user.kverildigiyer || '',
      kverildigitarih: user.kverildigitarih || '',
      
      // Teknik bilgiler
      ftipi: user.ftipi || '',
      osifre: user.osifre || '',
      adurum: user.adurum || '',
      sabitip: user.sabitip || '',
      atipi: user.atipi || '',
      vergidairesi: user.vergidairesi || '',
      invoice_type: Number(user.invoice_type) || 0,
      is_active: Number(user.is_active) || 1,
      ip_address: user.ip_address || '',
      expiration: user.expiration || ''
    });
    
    // Set expiration date and time separately
    const expirationData = this.formatExpirationForInput(user.expiration || '');
    this.userForm.patchValue({
      expirationDate: expirationData.date,
      expirationTime: expirationData.time
    });
    
    // Password is optional for edit
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    
    // Detect static/dynamic from current IP (public => Static, private => Dynamic)
    const isPrivate = this.isPrivateIp(user.ip_address || '');
    const sabit = isPrivate ? 'No' : 'Yes';
    this.userForm.patchValue({ sabitip: sabit });

    // Store for later use
    const isDynamicIp = sabit === 'No';
    
    // Set router selection from user data
    this.selectedRouterId = (user as any).router_id || null;
    console.log('🔍 Router Selection Debug:', {
      user_router_id: (user as any).router_id,
      user_router_name: (user as any).router_name,
      user_router_shortname: (user as any).router_shortname,
      selectedRouterId: this.selectedRouterId,
      availableRouters: this.availableRouters.length
    });
    
    console.log('🔍 IP Type Detection:', {
      ip_address: user.ip_address,
      isPrivate,
      sabit,
      isDynamicIp
    });

    // Load IP options based on detected type and prefill mapping in dynamic mode
    if (sabit === 'Yes') {
      // Static mode - load Metro IPs and set selected
      this.loadMetroIPsAsync(user.ip_address || '').then(() => {
        this.setSelectedIpAddress(user);
        console.log('🔍 Static IP mode - Metro IPs loaded and IP set:', {
          ip_address: user.ip_address,
          availableIps: this.availableIps.length
        });
      });
    } else {
      // Dynamic mode - load lists first, then set selected values
      const privateIpToSet = user.private_ip || '';
      const sharedPublicIpToSet = user.shared_public_ip || '';
      
      // Load both lists and then set selected values
      Promise.all([
        this.loadPrivateIpsFromPoolAsync(privateIpToSet),
        this.loadSharedPublicIpsAsync(sharedPublicIpToSet)
      ]).then(() => {
        // Set selected values after lists are loaded
        this.selectedPrivateIp = privateIpToSet;
        
        // For shared public IP, we need to construct the unique key from IP + Port
        if (sharedPublicIpToSet && user.port_range) {
          const uniqueKey = `${sharedPublicIpToSet}:${user.port_range}`;
          this.selectedSharedPublicIp = uniqueKey;
          this.selectedSharedPublicIpPortRange = user.port_range;
          
          console.log('🔍 Port range from user data:', {
            ip: sharedPublicIpToSet,
            portRange: user.port_range,
            uniqueKey: uniqueKey,
            mapHas: this.sharedPublicIpsMap.has(uniqueKey),
            mapValue: this.sharedPublicIpsMap.get(uniqueKey)
          });
        } else {
          this.selectedSharedPublicIp = '';
          this.selectedSharedPublicIpPortRange = '';
        }
        
        console.log('🔍 Dynamic IP mode - lists loaded and values set:', {
          privateIpToSet,
          sharedPublicIpToSet,
          portRange: user.port_range,
          selectedPrivateIp: this.selectedPrivateIp,
          selectedSharedPublicIp: this.selectedSharedPublicIp,
          selectedSharedPublicIpPortRange: this.selectedSharedPublicIpPortRange,
          availablePrivateIps: this.availablePrivateIps.length,
          availableSharedPublicIps: this.availableSharedPublicIps.length,
          sharedPublicIpsMapSize: this.sharedPublicIpsMap.size
        });
      });
    }
    
    this.showUserModal = true;

    // Load Extra IPs and available Metro IPs after form is ready
    setTimeout(() => {
      if (this.userForm) {
        this.loadExtraIps(user.username);
        this.loadAvailableExtraIps();
        
        // Check NAT status if dynamic IP
        console.log('🔍 Timeout check - isDynamicIp:', isDynamicIp, 'for user:', user.username);
        if (isDynamicIp) {
          console.log('🔍 Calling checkNatStatus for user:', user.username);
          this.checkNatStatus(user.username);
        } else {
          console.log('🔍 Skipping NAT check - Static IP mode');
        }
      }
    }, 300);
  }

  setSelectedIpAddress(user: User): void {
    if (user.ip_address && this.userForm) {
      this.selectedIpInfo = {
        ip: user.ip_address,
        type: user.sabitip === 'Yes' ? 'Static' : 'Dynamic'
      };
      
      // Add current IP to available options if not already present
      const currentIpExists = this.availableIps.some(ip => ip.value === user.ip_address);
      if (!currentIpExists) {
        this.availableIps.unshift({
          value: user.ip_address,
          display: user.ip_address + ' (Current)',
          type: user.sabitip === 'Yes' ? 'Static' : 'Dynamic',
          ip: user.ip_address
        });
      }
      
      // Set the form value for IP address safely
      if (this.userForm.get('ip_address')) {
        this.userForm.patchValue({
          ip_address: user.ip_address
        });
      }
    }
  }

  // Format expiration date from "31 Dec 2050 23:00" to separate date and time
  formatExpirationForInput(expiration: string): { date: string, time: string } {
    if (!expiration) return { date: '', time: '' };
    
    try {
      // Parse "31 Dec 2050 23:00" format
      const parts = expiration.split(' ');
      if (parts.length >= 4) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1];
        const year = parts[2];
        const time = parts[3];
        
        // Convert month name to number
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthNum = (monthNames.indexOf(month) + 1).toString().padStart(2, '0');
        
        return {
          date: `${year}-${monthNum}-${day}`,
          time: time
        };
      }
    } catch (error) {
      console.error('Error formatting expiration date:', error);
    }
    
    return { date: '', time: '' };
  }

  // Format expiration date from separate date and time to "31 Dec 2050 23:00"
  formatExpirationForBackend(date: string, time: string): string {
    if (!date || !time) return '';
    
    try {
      const dateObj = new Date(date + 'T' + time);
      const day = dateObj.getDate().toString().padStart(2, '0');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[dateObj.getMonth()];
      const year = dateObj.getFullYear();
      const hours = dateObj.getHours().toString().padStart(2, '0');
      const minutes = dateObj.getMinutes().toString().padStart(2, '0');
      
      return `${day} ${month} ${year} ${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting expiration date for backend:', error);
    }
    
    return '';
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.userForm.reset();
    this.currentUser = null;
    this.availableIps = [];
    this.selectedIpInfo = null;
    
    // Recreate form to reset validators
    this.userForm = this.createUserForm();
  }

  async saveUser(): Promise<void> {
    if (this.userForm.valid) {
      const formData = this.userForm.value;
      
      // Format expiration date for backend
      if (formData.expirationDate && formData.expirationTime) {
        formData.expiration = this.formatExpirationForBackend(formData.expirationDate, formData.expirationTime);
      }
      
      // Check IP availability for new users
      if (!this.isEditing && formData.ip_address) {
        const isAvailable = await this.checkIpAvailability(formData.ip_address);
        if (!isAvailable) {
          alert('This IP address is already assigned to another user. Please select a different IP address.');
          return;
        }
      }
      
      if (this.isEditing && this.currentUser) {
        this.userService.updateUser(this.currentUser.id, formData).subscribe({
          next: (response) => {
            if (response.success) {
              // If dynamic IP mode, assign the selected IPs
              const isStatic = formData.sabitip === 'Yes';
              if (!isStatic && this.selectedPrivateIp && this.selectedSharedPublicIp) {
                this.tryAssignDynamicIp();
              }
              
              this.closeUserModal();
              this.loadUsers();
            }
          },
          error: (error) => {
            console.error('Error updating user:', error);
          }
        });
      } else {
        this.userService.createUser(formData).subscribe({
          next: (response) => {
            if (response.success) {
              // If dynamic IP mode, assign the selected IPs for new user
              const isStatic = formData.sabitip === 'Yes';
              if (!isStatic && this.selectedPrivateIp && this.selectedSharedPublicIp) {
                // For new users, we need to set currentUser temporarily to make tryAssignDynamicIp work
                const createdUsername = formData.username;
                if (createdUsername) {
                  // Call assign-ip directly for new users
                  const [sharedPublicIpAddress, portRange] = this.selectedSharedPublicIp.split(':');
                  const options = { 
                    sharedPublicIp: sharedPublicIpAddress,
                    portRange: portRange || this.selectedSharedPublicIpPortRange || '1-5000',
                    routerId: this.selectedRouterId || undefined
                  };
                  this.userService.assignIpToUser(createdUsername, this.selectedPrivateIp, false, options).subscribe({
                    next: (assignResponse) => {
                      if (assignResponse.success) {
                        console.log('✅ IP and NAT assigned to new user:', createdUsername);
                      }
                    },
                    error: (assignError) => {
                      console.error('Error assigning IP to new user:', assignError);
                    }
                  });
                }
              }
              
              this.closeUserModal();
              this.loadUsers();
            }
          },
          error: (error) => {
            console.error('Error creating user:', error);
          }
        });
      }
    }
  }

  deleteUser(user: User): void {
    if (confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadUsers();
          }
        },
        error: (error) => {
          console.error('Error deleting user:', error);
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

  onUyrukChange(event: any): void {
    const uyruk = event.target.value;
    if (uyruk !== 'Foreign') {
      // Foreign değilse kimlik belgesi alanlarını temizle
      this.userForm.patchValue({
        pasaportno: '',
        ciltno: '',
        kutukno: '',
        sayfano: '',
        kserino: '',
        kverildigiyer: '',
        kverildigitarih: ''
      });
    }
  }

  onMusteriTipiChange(event: any): void {
    const musteriTipi = event.target.value;
    if (musteriTipi !== 'Commercial') {
      // Commercial değilse ticari bilgilerini temizle
      this.userForm.patchValue({
        unvan: '',
        meslek: '',
        vergino: '',
        vergidairesi: ''
      });
    }
  }

  // Tab change handlers
  setActiveTab(tabName: string): void {
    this.activeTab = tabName;
    console.log('Tab changed to:', tabName);
  }

  onTabChange(tabName: string): void {
    // Tab değişikliğinde özel işlemler yapılabilir
    console.log('Tab changed to:', tabName);
  }

  // Check if Commercial tab should be visible
  isCommercialTabVisible(): boolean {
    return this.userForm.get('musteri_tipi')?.value === 'Commercial';
  }

  // IP Address selection methods
  onStaticIpChange(event: any): void {
    const isStatic = event.target.value === 'Yes';
    this.userForm.patchValue({ ip_address: '' }); // Clear IP selection
    this.availableIps = [];
    this.selectedIpInfo = null;
    // Reset dynamic selections
    this.availablePrivateIps = [];
    this.availableSharedPublicIps = [];
    this.selectedPrivateIp = '';
    this.selectedSharedPublicIp = '';
    
    if (isStatic) {
      this.loadMetroIPs();
    } else {
      this.loadPrivateIpsFromPool();
      this.loadSharedPublicIps();
    }
  }

  onIpAddressChange(event: any): void {
    const selectedIp = event.target.value;
    if (selectedIp) {
      this.selectedIpInfo = this.availableIps.find(ip => ip.value === selectedIp);
      
      // If editing, update IP assignment immediately
      if (this.isEditing && this.currentUser) {
        const isPrivate = this.isPrivateIp(selectedIp);
        const isStatic = this.userForm.get('sabitip')?.value === 'Yes';
        // If private, ask/select shared public IP and send along
        const opts: any = {};
        if (isPrivate) {
          // Pick first shared public IP with ports, for now use availableExtraIps with ports? We fetch via MetroIP service 'static' returns only static; shared list assumed fetched elsewhere.
          // Minimal: prompt
          const pub = prompt('Private IP selected. Enter shared public IP (e.g., 212.x.x.x):');
          if (!pub) {
            console.warn('Shared public IP is required for private IP assignment. Skipping assign.');
            return;
          }
          opts.sharedPublicIp = pub;
          opts.portRange = '1-5000';
        }
        this.assignIpToUser(selectedIp, opts);
      }
    } else {
      this.selectedIpInfo = null;
    }
  }

  // Assign IP to user
  assignIpToUser(ipAddress: string, options?: { sharedPublicIp?: string; portRange?: string; routerId?: number }): void {
    if (!this.currentUser) return;

    const isStatic = this.userForm.get('sabitip')?.value === 'Yes';
    this.userService.assignIpToUser(this.currentUser.username, ipAddress, isStatic, options).subscribe({
      next: (response) => {
        if (response.success) {
          console.log('IP assigned successfully');
        }
      },
      error: (error) => {
        console.error('Error assigning IP:', error);
      }
    });
  }

  // Simple IPv4 private detection
  isPrivateIp(ip: string): boolean {
    const m = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (!m) return false;
    const a = parseInt(m[1], 10), b = parseInt(m[2], 10);
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }

  // ---------- Dynamic IP (Private + Shared Public) ----------
  availablePrivateIps: Array<{ value: string; display: string }>
    = [];
  availableSharedPublicIps: Array<{ value: string; display: string; ports?: string }>
    = [];
  sharedPublicIpsMap: Map<string, string> = new Map(); // IP -> Port range map
  selectedPrivateIp: string = '';
  selectedSharedPublicIp: string = '';
  selectedSharedPublicIpPortRange: string = '';

  loadPrivateIpsFromPool(): void {
    this.ipService.getIpPools({ page: 1, limit: 1000, tenantId: this.selectedTenantId || null })
      .subscribe({
        next: (resp) => {
          const list = resp?.data?.pools || [];
          this.availablePrivateIps = list
            .filter((p: any) => (!p.username || p.username === null || p.username === '') && typeof p.framedipaddress === 'string')
            .map((p: any) => p.framedipaddress)
            .filter((ip: string) => this.isPrivateIp(ip))
            .map((ip: string) => ({ value: ip, display: `${ip} (Private)` }));
          
          // Add current private IP if not in list
          if (this.selectedPrivateIp && !this.availablePrivateIps.find(ip => ip.value === this.selectedPrivateIp)) {
            this.availablePrivateIps.unshift({ 
              value: this.selectedPrivateIp, 
              display: `${this.selectedPrivateIp} (Current)` 
            });
          }
        },
        error: (err) => {
          console.error('Load IP Pools error:', err);
        }
      });
  }

  // Async version that returns a Promise
  loadPrivateIpsFromPoolAsync(currentIp: string): Promise<void> {
    return new Promise((resolve) => {
      this.ipService.getIpPools({ page: 1, limit: 1000, tenantId: this.selectedTenantId || null })
        .subscribe({
          next: (resp) => {
            const list = resp?.data?.pools || [];
            this.availablePrivateIps = list
              .filter((p: any) => (!p.username || p.username === null || p.username === '') && typeof p.framedipaddress === 'string')
              .map((p: any) => p.framedipaddress)
              .filter((ip: string) => this.isPrivateIp(ip))
              .map((ip: string) => ({ value: ip, display: `${ip} (Private)` }));
            
            // Add current private IP if provided and not in list
            if (currentIp && !this.availablePrivateIps.find(ip => ip.value === currentIp)) {
              this.availablePrivateIps.unshift({ 
                value: currentIp, 
                display: `${currentIp} (Current)` 
              });
            }
            resolve();
          },
          error: (err) => {
            console.error('Load IP Pools error:', err);
            resolve(); // Resolve anyway to not block
          }
        });
    });
  }

  loadSharedPublicIps(): void {
    this.ipService.getMetroIPs({ page: 1, limit: 1000, tenantId: this.selectedTenantId || null, metroIpFilter: 'shared' })
      .subscribe({
        next: (resp) => {
          const list = resp?.data?.metroips || [];
          this.availableSharedPublicIps = list
            .filter((m: any) => (!m.user || m.user === null || m.user === '') && !!m.ports)
            .map((m: any) => ({ value: m.ipaddress, display: `${m.ipaddress} (ports ${m.ports})`, ports: m.ports }));
          
          // Add current shared public IP if not in list
          if (this.selectedSharedPublicIp && !this.availableSharedPublicIps.find(ip => ip.value === this.selectedSharedPublicIp)) {
            // Get port range from current user if available
            const portInfo = this.currentUser?.port_range ? ` (ports ${this.currentUser.port_range})` : '';
            this.availableSharedPublicIps.unshift({ 
              value: this.selectedSharedPublicIp, 
              display: `${this.selectedSharedPublicIp}${portInfo} (Current)` 
            });
          }
        },
        error: (err) => {
          console.error('Load shared public IPs error:', err);
        }
      });
  }

  // Async version that returns a Promise
  loadSharedPublicIpsAsync(currentIp: string): Promise<void> {
    return new Promise((resolve) => {
      this.ipService.getMetroIPs({ page: 1, limit: 1000, tenantId: this.selectedTenantId || null, metroIpFilter: 'shared' })
        .subscribe({
          next: (resp) => {
            const list = resp?.data?.metroips || [];
            
            // Clear and rebuild the map
            this.sharedPublicIpsMap.clear();
            
            this.availableSharedPublicIps = list
              .filter((m: any) => !!m.ports) // Only require ports field (show all, including assigned ones)
              .map((m: any) => {
                // Store in map: IP+Port -> Port (unique key for each port range)
                const uniqueKey = `${m.ipaddress}:${m.ports}`;
                this.sharedPublicIpsMap.set(uniqueKey, m.ports);
                
                // Display format: show if available or assigned to current user
                const isAvailable = !m.user || m.user === null || m.user === '';
                const isCurrent = m.user === this.currentUser?.username;
                const statusLabel = isAvailable ? ' (Available)' : (isCurrent ? ' (Current)' : ` (${m.user})`);
                
                return { 
                  value: uniqueKey, // Use unique key as value
                  display: `${m.ipaddress} ports ${m.ports}${statusLabel}`, 
                  ports: m.ports,
                  ipaddress: m.ipaddress,
                  isAvailable: isAvailable,
                  isCurrent: isCurrent
                };
              });
            
            // Add current shared public IP if provided and not in list
            if (currentIp && !this.availableSharedPublicIps.find(ip => ip.value === currentIp)) {
              // Get port range from current user if available
              const portInfo = this.currentUser?.port_range ? ` (ports ${this.currentUser.port_range})` : '';
              const ports = this.currentUser?.port_range || '';
              this.sharedPublicIpsMap.set(currentIp, ports);
              this.availableSharedPublicIps.unshift({ 
                value: currentIp, 
                display: `${currentIp}${portInfo} (Current)`,
                ports: ports
              });
            }
            
            console.log('🔍 Shared Public IPs Map:', Array.from(this.sharedPublicIpsMap.entries()));
            resolve();
          },
          error: (err) => {
            console.error('Load shared public IPs error:', err);
            resolve(); // Resolve anyway to not block
          }
        });
    });
  }

  onPrivateIpChange(value: string): void {
    this.selectedPrivateIp = value || '';
    console.log('🔍 Private IP changed to:', this.selectedPrivateIp);
    // Note: Do NOT auto-assign. User must click "Save" button.
  }

  onSharedPublicIpChange(value: string): void {
    this.selectedSharedPublicIp = value || '';
    
    // Find and store the port range for this IP
    const selectedIpInfo = this.availableSharedPublicIps.find(ip => ip.value === value);
    this.selectedSharedPublicIpPortRange = selectedIpInfo?.ports || '1-5000';
    
    console.log('🔍 Shared Public IP changed to:', this.selectedSharedPublicIp, 'ports:', this.selectedSharedPublicIpPortRange);
    // Note: Do NOT auto-assign. User must click "Save" button.
  }

  onSharedPublicIpChangeEvent(event: any): void {
    const selectElement = event.target as HTMLSelectElement;
    const uniqueKey = selectElement.value; // Format: "IP:PORT"
    
    this.selectedSharedPublicIp = uniqueKey;
    
    // Get port range from map using unique key
    this.selectedSharedPublicIpPortRange = this.sharedPublicIpsMap.get(uniqueKey) || '';
    
    // Parse IP address from unique key for display
    const [ipAddress, portRange] = uniqueKey.split(':');
    
    console.log('🔍 Shared Public IP changed (event):', {
      uniqueKey: uniqueKey,
      ipAddress: ipAddress,
      portRange: portRange,
      selectedSharedPublicIpPortRange: this.selectedSharedPublicIpPortRange,
      mapHas: this.sharedPublicIpsMap.has(uniqueKey),
      mapValue: this.sharedPublicIpsMap.get(uniqueKey)
    });

    // Note: Do NOT auto-assign. User must click "Save" button.
  }

  onRouterChange(routerId: number | null): void {
    this.selectedRouterId = routerId;
    console.log('🔍 Selected Router ID:', routerId);
    
    // Filter IPs based on selected router
    if (routerId) {
      this.filterIpsByRouter(routerId);
    }
  }

  getSelectedRouterName(): string {
    if (!this.selectedRouterId) return '';
    const router = this.availableRouters.find(r => r.value === this.selectedRouterId);
    return router ? router.display : '';
  }

  filterIpsByRouter(routerId: number): void {
    const selectedRouter = this.availableRouters.find(r => r.value === routerId);
    if (!selectedRouter) return;

    // Filter static IPs by router
    this.availableIps = this.availableIps.filter(ip => 
      !(ip as any).nas || (ip as any).nas === selectedRouter.nasname
    );

    // Filter private IPs by router
    this.availablePrivateIps = this.availablePrivateIps.filter(ip => 
      !(ip as any).nas || (ip as any).nas === selectedRouter.nasname
    );

    // Filter shared public IPs by router
    this.availableSharedPublicIps = this.availableSharedPublicIps.filter(ip => 
      !(ip as any).nas || (ip as any).nas === selectedRouter.nasname
    );
  }

  private tryAssignDynamicIp(): void {
    // Only in edit mode, assign when both selected
    const isStatic = this.userForm.get('sabitip')?.value === 'Yes';
    if (isStatic) return;
    if (!this.currentUser) return;
    if (!this.selectedPrivateIp || !this.selectedSharedPublicIp) return;

    // Parse IP address from unique key (format: "IP:PORT")
    const [sharedPublicIpAddress, portRange] = this.selectedSharedPublicIp.split(':');
    
    const options = { 
      sharedPublicIp: sharedPublicIpAddress, // Send only IP address (without port)
      portRange: portRange || this.selectedSharedPublicIpPortRange || '1-5000',
      routerId: this.selectedRouterId || undefined // Send routerId if selected
    };
    this.assignIpToUser(this.selectedPrivateIp, options);
  }

  // Correct visual static/dynamic detection from IP value
  getIpTypeFromValue(ip?: string | null): 'Static' | 'Dynamic' | '' {
    if (!ip) return '';
    return this.isPrivateIp(ip) ? 'Dynamic' : 'Static';
  }

  // ---------- Extra IP Management ----------
  loadAvailableExtraIps(): void {
    if (!this.userForm) {
      console.warn('Form not ready, skipping loadAvailableExtraIps');
      return;
    }
    
    this.loadingAvailableExtraIps = true;
    this.ipService.getMetroIPs({
      page: 1,
      limit: 1000,
      tenantId: this.selectedTenantId,
      metroIpFilter: 'static'
    }).subscribe({
      next: (resp) => {
        this.loadingAvailableExtraIps = false;
        if (resp?.success) {
          const list = resp.data?.metroips || [];
          // Get all primary IPs to exclude
          const currentUserIp = this.currentUser?.ip_address || '';
          const allPrimaryIps = [this.primaryIp, currentUserIp].filter(ip => ip);
          
          // Filter out IPs with port ranges (only allow single IPs without ports)
          // Also exclude all primary IPs
          this.availableExtraIps = list
            .filter((m: any) => !m.ports || m.ports === '' || m.ports === null)
            .filter((m: any) => !m.user || m.user === '') // Only available IPs
            .filter((m: any) => !allPrimaryIps.includes(m.ipaddress)) // Exclude all primary IPs
            .map((m: any) => ({ ip: m.ipaddress }));
        }
      },
      error: () => {
        this.loadingAvailableExtraIps = false;
      }
    });
  }

  loadExtraIps(username: string): void {
    if (!username || !this.userForm) {
      console.warn('Form not ready or no username, skipping loadExtraIps');
      return;
    }
    this.loadingExtraIps = true;
    this.userService.getExtraIps(username).subscribe({
      next: (resp) => {
        this.loadingExtraIps = false;
        if (resp?.success) {
          // Store primary IP info from Radreply
          this.primaryIp = resp.data?.primaryIp || '';
          this.primaryIpRouter = resp.data?.defaultRouter || null;

          const routes = resp.data?.routesOnMikrotik || [];
          const metroAssigned = resp.data?.metroipAssigned || [];
          const primaryIpFromRadreply = resp.data?.primaryIp || '';
          
          // Also consider current user's IP as primary (from IP Address Assignment)
          const currentUserIp = this.currentUser?.ip_address || '';
          const allPrimaryIps = [primaryIpFromRadreply, currentUserIp].filter(ip => ip);
          
          // Only show extra IPs (exclude all primary IPs)
          const set: Record<string, any> = {};
          metroAssigned.forEach((m: any) => {
            const key = m.ip?.split('/')?.[0] || m.ip;
            // Only include if it's not any of the primary IPs
            if (key && !allPrimaryIps.includes(key)) {
              set[key] = { ip: key };
            }
          });
          routes.forEach((r: any) => {
            const key = (r.dst || '').split('/')?.[0];
            // Only include if it's not any of the primary IPs
            if (key && !allPrimaryIps.includes(key)) {
              set[key] = { ip: key, gateway: r.gateway };
            }
          });
          this.extraIps = Object.values(set);
          this.extraIpGateway = primaryIpFromRadreply || currentUserIp || '';
          this.extraIpRouterId = resp.data?.defaultRouter?.id || null;
        }
      },
      error: () => {
        this.loadingExtraIps = false;
      }
    });
  }

  addExtraIpToUser(): void {
    if (!this.currentUser || !this.newExtraIp) return;
    const username = this.currentUser.username;
    this.userService.addExtraIp(username, this.newExtraIp, this.extraIpRouterId || undefined, this.extraIpGateway || undefined)
      .subscribe({
        next: (resp) => {
          if (resp?.success) {
            this.newExtraIp = '';
            this.loadExtraIps(username);
            this.loadAvailableExtraIps();
          }
        },
        error: (err) => {
          console.error('Add extra IP error:', err);
        }
      });
  }

  deleteExtraIpFromUser(ip: string): void {
    if (!this.currentUser || !ip) return;
    const username = this.currentUser.username;
    if (!confirm(`Remove routed IP ${ip}?`)) return;
    this.userService.deleteExtraIp(username, ip).subscribe({
      next: (resp) => {
        if (resp?.success) {
          this.loadExtraIps(username);
          this.loadAvailableExtraIps();
        }
      },
      error: (err) => {
        console.error('Delete extra IP error:', err);
      }
    });
  }

  loadMetroIPs(): Promise<void> {
    return this.loadMetroIPsAsync('');
  }

  loadMetroIPsAsync(currentIp: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ipService.getMetroIPs({
        page: 1,
        limit: 1000,
        search: '',
        tenantId: this.selectedTenantId,
        metroIpFilter: 'static' // Only static IPs
      }).subscribe({
        next: (response) => {
          if (response.success) {
            const metroIPs = response.data.metroips || [];
            this.availableIps = metroIPs
              .filter((metro: any) => !metro.user || metro.user === '') // Only available IPs
              .map((metro: any) => ({
                value: metro.ipaddress,
                display: `${metro.ipaddress} - ${metro.ports}`,
                type: 'Static',
                ip: metro.ipaddress,
                ports: metro.ports,
                nas: metro.nasname
              }));
            
            // Add current IP if provided and not in list
            if (currentIp && !this.availableIps.find(ip => ip.value === currentIp)) {
              this.availableIps.unshift({
                value: currentIp,
                display: `${currentIp} (Current)`,
                type: 'Static',
                ip: currentIp,
                ports: '',
                nas: ''
              });
            }
            
            resolve();
          } else {
            reject(new Error('Failed to load Metro IPs'));
          }
        },
        error: (error) => {
          console.error('Error loading Metro IPs:', error);
          reject(error);
        }
      });
    });
  }

  loadIpPools(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ipService.getIpPools({
        page: 1,
        limit: 1000,
        search: '',
        tenantId: this.selectedTenantId
      }).subscribe({
        next: (response) => {
          if (response.success) {
            const ipPools = response.data.pools || [];
            this.availableIps = ipPools
              .filter((pool: any) => !pool.username || pool.username === '') // Only available IPs
              .map((pool: any) => ({
                value: pool.framedipaddress,
                display: pool.framedipaddress,
                type: 'Dynamic',
                ip: pool.framedipaddress,
                nas: pool.nasname
              }));
            resolve();
          } else {
            reject(new Error('Failed to load IP Pools'));
          }
        },
        error: (error) => {
          console.error('Error loading IP Pools:', error);
          reject(error);
        }
      });
    });
  }

  // Check if IP address is already assigned to another user
  checkIpAvailability(ipAddress: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Check in radippool table
      this.ipService.getIpPools({
        page: 1,
        limit: 1000,
        search: ipAddress,
        tenantId: this.selectedTenantId
      }).subscribe({
        next: (response) => {
          if (response.success) {
            const ipPools = response.data.pools || [];
            const isAssignedInPool = ipPools.some((pool: any) => 
              pool.framedipaddress === ipAddress && pool.username && pool.username !== ''
            );
            
            if (isAssignedInPool) {
              resolve(false);
              return;
            }

            // Check in Metro IP table
            this.ipService.getMetroIPs({
              page: 1,
              limit: 1000,
              search: ipAddress,
              tenantId: this.selectedTenantId
            }).subscribe({
              next: (metroResponse) => {
                if (metroResponse.success) {
                  const metroIPs = metroResponse.data.metroips || [];
                  const isAssignedInMetro = metroIPs.some((metro: any) => 
                    metro.ipaddress === ipAddress && metro.user && metro.user !== ''
                  );
                  resolve(!isAssignedInMetro);
                } else {
                  resolve(true);
                }
              },
              error: (error) => {
                console.error('Error checking Metro IP availability:', error);
                resolve(true);
              }
            });
          } else {
            resolve(true);
          }
        },
        error: (error) => {
          console.error('Error checking IP availability:', error);
          resolve(true);
        }
      });
    });
  }

  // Check NAT status
  async checkNatStatus(username: string): Promise<void> {
    console.log('🔍 checkNatStatus called for:', username);
    this.loadingNatStatus = true;
    this.showWriteNatButton = false;
    this.natSuccessMessage = '';
    this.natErrorMessage = '';

    try {
      // If router is selected, pass routerId to nat-status endpoint
      const params = this.selectedRouterId ? { routerId: this.selectedRouterId } : {};
      const response = await this.userService.getNatStatus(username, params).toPromise();
      console.log('🔍 NAT status response:', response);
      
      if (response?.success && response?.data) {
        const { hasNat, needsNatConfig, natDetails, isPrivateIp } = response.data;
        
        console.log('🔍 NAT status details (from Mikrotik):', {
          hasNat,
          needsNatConfig,
          isPrivateIp,
          natDetails
        });

        if (!isPrivateIp) {
          // Public IP - no NAT needed
          this.showWriteNatButton = false;
          console.log('🔍 Public IP - no NAT needed');
        } else if (hasNat) {
          // NAT is active on Mikrotik (truth source)
          this.showWriteNatButton = false;
          this.natSuccessMessage = `✓ NAT rule is active (${natDetails?.sharedPublicIp}:${natDetails?.portRange})`;
          console.log('🔍 NAT is active on Mikrotik - showing success message');
        } else {
          // Private IP but no NAT on router - show button to write
          this.showWriteNatButton = true;
          this.natButtonText = 'Write NAT Rule to Router';
          console.log('🔍 Private IP needs NAT - showing write button');
        }
      }
    } catch (error) {
      console.error('❌ Error checking NAT status:', error);
      this.natErrorMessage = 'Failed to check NAT status';
    } finally {
      this.loadingNatStatus = false;
      console.log('🔍 NAT status check complete. UI state:', {
        showWriteNatButton: this.showWriteNatButton,
        natSuccessMessage: this.natSuccessMessage,
        natErrorMessage: this.natErrorMessage
      });
    }
  }

  // Write NAT rule to router
  async writeNatToRouter(): Promise<void> {
    if (!this.currentUser?.username) {
      return;
    }

    // Check if shared public IP is selected
    if (!this.selectedSharedPublicIp) {
      this.natErrorMessage = 'Please select a Shared Public IP first';
      return;
    }

    this.writingNat = true;
    this.natErrorMessage = '';

    // Parse IP and port from unique key (format: "IP:PORT")
    const [sharedPublicIpAddress, portRange] = this.selectedSharedPublicIp.split(':');
    
    console.log('🔍 Writing NAT with:', {
      username: this.currentUser.username,
      privateIp: this.selectedPrivateIp,
      uniqueKey: this.selectedSharedPublicIp,
      sharedPublicIpAddress: sharedPublicIpAddress,
      portRange: portRange || this.selectedSharedPublicIpPortRange
    });

    const portRangeToSend = portRange || this.selectedSharedPublicIpPortRange || '1-5000';

    try {
      const response = await this.userService.writeNatRuleWithDetails(
        this.currentUser.username, 
        sharedPublicIpAddress, // Send IP address only (without port)
        portRangeToSend,
        this.selectedRouterId || undefined // Send routerId if selected
      ).toPromise();
      
      if (response?.success) {
        this.showWriteNatButton = false;
        this.natSuccessMessage = '✓ NAT rule written successfully';
        
        // Re-check status after 1 second
        setTimeout(() => {
          if (this.currentUser?.username) {
            this.checkNatStatus(this.currentUser.username);
          }
        }, 1000);
      } else {
        this.natErrorMessage = response?.message || 'Failed to write NAT rule';
      }
    } catch (error: any) {
      console.error('❌ Error writing NAT rule:', error);
      this.natErrorMessage = error?.error?.message || 'Failed to write NAT rule to router';
    } finally {
      this.writingNat = false;
    }
  }
}
