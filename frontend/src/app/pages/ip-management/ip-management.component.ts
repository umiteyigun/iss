import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IpService, IpPool, MetroIP } from '../../services/ip.service';
import { TenantService } from '../../services/tenant.service';
import { NasService, NasDevice } from '../../services/nas.service';

@Component({
  selector: 'app-ip-management',
  templateUrl: './ip-management.component.html',
  styleUrls: ['./ip-management.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, TranslateModule]
})
export class IpManagementComponent implements OnInit {
  ipPools: IpPool[] = [];
  metroIPs: MetroIP[] = [];
  loading = false;
  
  // Active tab
  activeTab = 'pools';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPools = 0;
  totalPages = 0;
  
  // Search
  searchTerm = '';

  // Tenant filtering
  isSuperAdmin = false;
  selectedTenantId: number | null = null;
  tenants: any[] = [];

  // NAS devices
  nasDevices: NasDevice[] = [];

  // Metro IP Filters
  metroIpFilter = '';
  ipAddressFilter = '';
  nasNameFilter = '';

  // Stats
  ipPoolStats = {
    total: 0,
    available: 0,
    inUse: 0
  };

  metroIpStats = {
    total: 0,
    available: 0,
    inUse: 0,
    static: 0,
    staticAvailable: 0,
    staticInUse: 0,
    shared: 0,
    sharedAvailable: 0,
    sharedInUse: 0
  };

  // Modals
  showIpPoolModal = false;
  showMetroIpModal = false;

  // Forms
  ipPoolForm: FormGroup;
  metroIpForm: FormGroup;

  // IP Preview
  ipPreview: any[] = [];
  metroIpPreview: any[] = [];

  constructor(
    private ipService: IpService,
    private tenantService: TenantService,
    private nasService: NasService,
    private fb: FormBuilder
  ) {
    this.ipPoolForm = this.createIpPoolForm();
    this.metroIpForm = this.createMetroIpForm();
  }

  ngOnInit(): void {
    this.checkUserRole();
    this.loadData();
    this.loadNasDevices();
    if (this.isSuperAdmin) {
      this.loadTenants();
    }
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
      this.selectedTenantId = null; // Show all tenants by default
      console.log('🔍 Super Admin - selectedTenantId set to null');
    } else {
      // Regular admin can only see their tenant
      this.selectedTenantId = user.tenant_id;
      console.log('🔍 Regular Admin - selectedTenantId set to:', this.selectedTenantId);
    }
  }

  loadData(): void {
    if (this.activeTab === 'pools') {
      this.loadIpPools();
    } else {
      this.loadMetroIPs();
    }
  }

  // Load Stats
  loadStats(): void {
    if (this.activeTab === 'pools') {
      this.loadIpPoolStats();
    } else {
      this.loadMetroIpStats();
    }
  }

  loadIpPoolStats(): void {
    this.ipService.getIpPools({
      page: 1,
      limit: 1000, // Get all for stats
      search: this.searchTerm,
      tenantId: this.selectedTenantId
    }).subscribe({
      next: (response) => {
        if (response.success) {
          const pools = response.data.pools || [];
          this.ipPoolStats = {
            total: pools.length,
            available: pools.filter((pool: any) => !pool.username).length,
            inUse: pools.filter((pool: any) => pool.username).length
          };
        }
      },
      error: (error) => {
        console.error('Error loading IP Pool stats:', error);
      }
    });
  }

  loadMetroIpStats(): void {
    this.ipService.getMetroIPs({
      page: 1,
      limit: 1000, // Get all for stats
      search: this.searchTerm,
      tenantId: this.selectedTenantId,
      metroIpFilter: this.metroIpFilter,
      ipAddressFilter: this.ipAddressFilter,
      nasNameFilter: this.nasNameFilter
    }).subscribe({
      next: (response) => {
        if (response.success) {
          const metroIPs = response.data.metroips || [];
          const staticIPs = metroIPs.filter((metro: any) => metro.ip_type === 0);
          const sharedIPs = metroIPs.filter((metro: any) => metro.ip_type === 1);
          
          this.metroIpStats = {
            total: metroIPs.length,
            available: metroIPs.filter((metro: any) => !metro.user).length,
            inUse: metroIPs.filter((metro: any) => metro.user).length,
            static: staticIPs.length,
            staticAvailable: staticIPs.filter((metro: any) => !metro.user).length,
            staticInUse: staticIPs.filter((metro: any) => metro.user).length,
            shared: sharedIPs.length,
            sharedAvailable: sharedIPs.filter((metro: any) => !metro.user).length,
            sharedInUse: sharedIPs.filter((metro: any) => metro.user).length
          };
        }
      },
      error: (error) => {
        console.error('Error loading Metro IP stats:', error);
      }
    });
  }

  loadIpPools(): void {
    this.loading = true;
    
    this.ipService.getIpPools({
      page: this.currentPage,
      limit: this.pageSize,
      search: this.searchTerm,
      tenantId: this.selectedTenantId
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.ipPools = response.data.pools || [];
          this.totalPools = response.data.pagination?.total || 0;
          this.totalPages = response.data.pagination?.pages || 0;
          // Load stats after data is loaded
          this.loadIpPoolStats();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading IP pools:', error);
        this.loading = false;
      }
    });
  }

  loadMetroIPs(): void {
    this.loading = true;

    console.log('🔍 Loading MetroIPs with params:', {
      currentPage: this.currentPage,
      pageSize: this.pageSize,
      searchTerm: this.searchTerm,
      selectedTenantId: this.selectedTenantId,
      metroIpFilter: this.metroIpFilter,
      ipAddressFilter: this.ipAddressFilter,
      nasNameFilter: this.nasNameFilter
    });

    this.ipService.getMetroIPs({
      page: this.currentPage,
      limit: this.pageSize,
      search: this.searchTerm,
      tenantId: this.selectedTenantId,
      metroIpFilter: this.metroIpFilter,
      ipAddressFilter: this.ipAddressFilter,
      nasNameFilter: this.nasNameFilter
    }).subscribe({
      next: (response) => {
        console.log('📊 MetroIP API Response:', response);

        if (response.success) {
          console.log('📊 MetroIP Response data:', response.data);
          this.metroIPs = response.data.metroips || [];
          this.totalPools = response.data.pagination?.total || 0;
          this.totalPages = response.data.pagination?.pages || 0;
          console.log('✅ MetroIPs loaded:', this.metroIPs.length, 'records');
          console.log('✅ Total MetroIPs:', this.totalPools);
          console.log('✅ Total pages:', this.totalPages);
          
          // Load stats after data is loaded
          this.loadMetroIpStats();
        } else {
          console.error('❌ MetroIP API returned success: false');
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Error loading MetroIPs:', error);
        this.loading = false;
      }
    });
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadData();
  }

  onMetroIpFilterChange(): void {
    this.currentPage = 1;
    this.loadData();
  }

  clearMetroIpFilters(): void {
    this.metroIpFilter = '';
    this.ipAddressFilter = '';
    this.nasNameFilter = '';
    this.currentPage = 1;
    this.loadData();
  }

  onTenantChange(value: any): void {
    this.currentPage = 1;
    
    // Handle the selected value
    if (value === '' || value === 'null' || value === null) {
      this.selectedTenantId = null;
    } else {
      this.selectedTenantId = parseInt(value);
    }
    
    
    // Reload NAS devices for the new tenant
    this.loadNasDevices();
    
    // Reload data
    this.loadData();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadData();
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.searchTerm = '';
    this.loadData();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = Math.min(this.totalPages, 5);
    
    for (let i = 1; i <= maxPages; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  formatDateTime(dateTime: string | null): string {
    if (!dateTime) return '-';
    
    try {
      const date = new Date(dateTime);
      return date.toLocaleString('tr-TR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '-';
    }
  }

  getStatusBadgeClass(ipPool: IpPool): string {
    if (ipPool.username) {
      return 'badge badge-danger'; // Kullanılan - Kırmızı
    }
    return 'badge badge-success'; // Boş - Yeşil
  }

  getStatusText(ipPool: IpPool): string {
    if (ipPool.username) {
      return 'In Use';
    }
    return 'Available';
  }

  getMetroIpStatusBadgeClass(metroIP: MetroIP): string {
    if (metroIP.user) {
      return 'badge badge-danger'; // In Use - Red
    }
    return 'badge badge-success'; // Available - Green
  }

  getMetroIpStatusText(metroIP: MetroIP): string {
    if (metroIP.user) {
      return 'In Use';
    }
    return 'Available';
  }

  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  // Form Creation Methods
  private createIpPoolForm(): FormGroup {
    return this.fb.group({
      nas_id: ['', Validators.required],
      base_ip: ['', Validators.required],
      subnet_mask: ['', Validators.required],
      tenant_id: ['', this.isSuperAdmin ? Validators.required : null]
    });
  }

  private createMetroIpForm(): FormGroup {
    return this.fb.group({
      nas_id: ['', Validators.required],
      ipaddress: ['', Validators.required],
      client_count: [''],
      ip_type: ['', Validators.required],
      tenant_id: ['']
    });
  }

  // Modal Methods
  openAddIpPoolModal(): void {
    this.ipPoolForm = this.createIpPoolForm();
    this.ipPreview = [];
    this.showIpPoolModal = true;
  }

  closeIpPoolModal(): void {
    this.showIpPoolModal = false;
    this.ipPoolForm.reset();
    this.ipPreview = [];
  }

  openAddMetroIpModal(): void {
    this.metroIpForm = this.createMetroIpForm();
    this.metroIpPreview = [];
    this.showMetroIpModal = true;
  }

  closeMetroIpModal(): void {
    this.showMetroIpModal = false;
    this.metroIpForm.reset();
    this.metroIpPreview = [];
  }

  // Load Tenants
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

  // Load NAS Devices (only with IP addresses)
  loadNasDevices(): void {
    this.nasService.getNasDevices({
      page: 1,
      limit: 1000, // Get all for dropdown
      tenant_id: this.selectedTenantId || undefined
    }).subscribe({
      next: (response) => {
        if (response.success) {
          // Filter NAS devices that have nasname (IP address) field
          this.nasDevices = response.data.nasDevices.filter((nas: NasDevice) => 
            nas.nasname && nas.nasname.trim() !== ''
          );
        }
      },
      error: (error) => {
        console.error('Error loading NAS devices:', error);
      }
    });
  }

  // IP Range Calculation
  calculateIpRange(): void {
    const baseIp = this.ipPoolForm.get('base_ip')?.value;
    const subnetMask = this.ipPoolForm.get('subnet_mask')?.value;

    if (baseIp && subnetMask) {
      this.ipPreview = this.generateIpRangeFromMask(baseIp, parseInt(subnetMask));
    } else {
      this.ipPreview = [];
    }
  }

  // Metro IP Range Calculation
  calculateMetroIpRange(): void {
    const nasId = this.metroIpForm.get('nas_id')?.value;
    const ipaddress = this.metroIpForm.get('ipaddress')?.value;
    const clientCount = this.metroIpForm.get('client_count')?.value;
    const ipType = this.metroIpForm.get('ip_type')?.value;

    if (nasId && ipaddress && ipType) {
      // Find selected NAS device
      const selectedNas = this.nasDevices.find(nas => nas.id === parseInt(nasId));
      if (!selectedNas) return;

      let finalClientCount = 1; // Default for Static IP

      if (ipType === '1' && clientCount) {
        // Shared IP - use selected client count
        finalClientCount = parseInt(clientCount);
      }

      this.metroIpPreview = this.generateMetroIpRange(selectedNas.nasname, ipaddress, finalClientCount, parseInt(ipType));
    } else {
      this.metroIpPreview = [];
    }
  }

  // Get Client Count Options
  getClientCountOptions(): number[] {
    const options = [];
    for (let i = 1; i <= 100; i++) {
      options.push(i);
    }
    return options;
  }

  // Get Shared Client Count Options (2-100)
  getSharedClientCountOptions(): number[] {
    const options = [];
    for (let i = 2; i <= 100; i++) {
      options.push(i);
    }
    return options;
  }

  // IP Type Change Handler
  onIpTypeChange(): void {
    const ipType = this.metroIpForm.get('ip_type')?.value;
    
    if (ipType === '0') {
      // Static IP - set client count to 1
      this.metroIpForm.patchValue({ client_count: '1' });
    } else if (ipType === '1') {
      // Shared IP - clear client count
      this.metroIpForm.patchValue({ client_count: '' });
    }
    
    this.calculateMetroIpRange();
  }

  private generateIpRangeFromMask(baseIp: string, subnetMask: number): any[] {
    const baseParts = baseIp.split('.').map(Number);
    const ips: any[] = [];
    
    // Calculate number of host bits
    const hostBits = 32 - subnetMask;
    const totalHosts = Math.pow(2, hostBits) - 2; // Subtract network and broadcast addresses
    
    // Calculate network address
    const networkParts = [...baseParts];
    const octetIndex = Math.floor(subnetMask / 8);
    const bitIndex = subnetMask % 8;
    
    // Clear host bits
    for (let i = octetIndex; i < 4; i++) {
      if (i === octetIndex) {
        // Clear bits from bitIndex to 7
        const mask = 0xFF << (8 - bitIndex);
        networkParts[i] = networkParts[i] & mask;
      } else {
        networkParts[i] = 0;
      }
    }
    
    // Generate IPs
    for (let i = 1; i <= totalHosts; i++) {
      const ipParts = [...networkParts];
      
      // Add host part
      let hostValue = i;
      for (let j = 3; j >= 0; j--) {
        ipParts[j] += hostValue % 256;
        hostValue = Math.floor(hostValue / 256);
        if (hostValue === 0) break;
      }
      
      const ip = ipParts.join('.');
      ips.push({
        framedipaddress: ip
      });
    }
    
    return ips;
  }

  private generateMetroIpRange(nasname: string, ipaddress: string, clientCount: number, ipType: number): any[] {
    const metroIPs: any[] = [];
    
    // Parse IP address and subnet
    const [baseIp, subnetMask] = ipaddress.split('/');
    const subnet = parseInt(subnetMask);
    
    // Calculate available IPs from subnet
    const hostBits = 32 - subnet;
    const totalIPs = Math.pow(2, hostBits) - 2; // Subtract network and broadcast
    
    // Generate IPs from subnet
    const baseParts = baseIp.split('.').map(Number);
    const networkParts = [...baseParts];
    
    // Clear host bits
    const octetIndex = Math.floor(subnet / 8);
    const bitIndex = subnet % 8;
    
    for (let i = octetIndex; i < 4; i++) {
      if (i === octetIndex) {
        const mask = 0xFF << (8 - bitIndex);
        networkParts[i] = networkParts[i] & mask;
      } else {
        networkParts[i] = 0;
      }
    }
    
    // Generate Metro IPs for each available IP
    for (let ipIndex = 1; ipIndex <= totalIPs; ipIndex++) {
      const ipParts = [...networkParts];
      
      // Add host part
      let hostValue = ipIndex;
      for (let j = 3; j >= 0; j--) {
        ipParts[j] += hostValue % 256;
        hostValue = Math.floor(hostValue / 256);
        if (hostValue === 0) break;
      }
      
      const currentIp = ipParts.join('.');
      
      // Generate clients for this IP
      const totalPorts = 65000;
      const portsPerClient = Math.floor(totalPorts / clientCount);
      
      for (let i = 0; i < clientCount; i++) {
        const startPort = (i * portsPerClient) + 1;
        const endPort = Math.min((i + 1) * portsPerClient, 65000);
        
        metroIPs.push({
          nasname: nasname,
          ipaddress: currentIp,
          ports: `${startPort}-${endPort}`,
          ip_type: ipType,
          user: null
        });
      }
    }
    
    return metroIPs;
  }

  // Save Methods
  saveIpPool(): void {
    if (this.ipPoolForm.valid && this.ipPreview.length > 0) {
      const formData = this.ipPoolForm.value;
      const nasId = formData.nas_id;
      const tenantId = formData.tenant_id || this.selectedTenantId;

      // Find selected NAS device
      const selectedNas = this.nasDevices.find(nas => nas.id === parseInt(nasId));
      if (!selectedNas) return;

      // Create IP pools for each IP in the range
      const ipPoolsToCreate = this.ipPreview.map(ip => ({
        pool_name: selectedNas.shortname, // Use NAS shortname as pool name
        nasname: selectedNas.nasname,
        framedipaddress: ip.framedipaddress,
        tenant_id: tenantId
      }));

      console.log('Creating IP pools:', ipPoolsToCreate);
      
      // Create IP pools one by one
      let completed = 0;
      let errors = 0;

      ipPoolsToCreate.forEach((ipPool, index) => {
        this.ipService.createIpPool(ipPool).subscribe({
          next: (response) => {
            completed++;
            console.log(`✅ IP Pool ${index + 1}/${ipPoolsToCreate.length} created:`, response);
            
            if (completed + errors === ipPoolsToCreate.length) {
              if (errors === 0) {
                alert(`Successfully created ${completed} IP pools!`);
              } else {
                alert(`Created ${completed} IP pools, ${errors} failed.`);
              }
              this.closeIpPoolModal();
              this.loadData(); // Refresh the list
            }
          },
          error: (error) => {
            errors++;
            console.error(`❌ IP Pool ${index + 1} creation failed:`, error);
            
            if (completed + errors === ipPoolsToCreate.length) {
              if (errors === ipPoolsToCreate.length) {
                alert('Failed to create IP pools. Please try again.');
              } else {
                alert(`Created ${completed} IP pools, ${errors} failed.`);
              }
              this.closeIpPoolModal();
              this.loadData(); // Refresh the list
            }
          }
        });
      });
    }
  }

  saveMetroIp(): void {
    const formData = this.metroIpForm.value;
    const ipType = formData.ip_type;

    // Validate form based on IP type
    let isValid = formData.nas_id && formData.ipaddress && formData.ip_type;

    if (ipType === '1') {
      // Shared IP requires client count
      isValid = isValid && formData.client_count;
    }

    if (isValid && this.metroIpPreview.length > 0) {
      // Find selected NAS device
      const selectedNas = this.nasDevices.find(nas => nas.id === parseInt(formData.nas_id));
      if (!selectedNas) return;

      let tenantId = this.selectedTenantId;

      // Super admin can select tenant, regular admin uses their own tenant
      if (this.isSuperAdmin && formData.tenant_id) {
        tenantId = formData.tenant_id;
      }

      console.log('Creating Metro IPs:', this.metroIpPreview);

      // Create Metro IPs one by one
      let completed = 0;
      let errors = 0;

      this.metroIpPreview.forEach((metroIP, index) => {
        const metroIpData = {
          ...metroIP,
          tenant_id: tenantId
        };

        this.ipService.createMetroIP(metroIpData).subscribe({
          next: (response) => {
            completed++;
            console.log(`✅ Metro IP ${index + 1}/${this.metroIpPreview.length} created:`, response);

            if (completed + errors === this.metroIpPreview.length) {
              if (errors === 0) {
                alert(`Successfully created ${completed} Metro IPs!`);
              } else {
                alert(`Created ${completed} Metro IPs, ${errors} failed.`);
              }
              this.closeMetroIpModal();
              this.loadData(); // Refresh the list
            }
          },
          error: (error) => {
            errors++;
            console.error(`❌ Metro IP ${index + 1} creation failed:`, error);

            if (completed + errors === this.metroIpPreview.length) {
              if (errors === this.metroIpPreview.length) {
                alert('Failed to create Metro IPs. Please try again.');
              } else {
                alert(`Created ${completed} Metro IPs, ${errors} failed.`);
              }
              this.closeMetroIpModal();
              this.loadData(); // Refresh the list
            }
          }
        });
      });
    } else {
      alert('Please fill in all required fields.');
    }
  }
}
