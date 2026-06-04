import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  IpService,
  IpPool,
  MetroIP,
  NatMetroIpRequest,
  METRO_IP_TYPE_BLOCK,
  METRO_IP_TYPE_ROUTED
} from '../../services/ip.service';
import { TenantService } from '../../services/tenant.service';
import { NasService, NasDevice } from '../../services/nas.service';
import { UserService } from '../../services/user.service';

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
  totalMetroItems = 0;
  totalPages = 0;
  private pageClampRetry = false;
  
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
  showRouteModal = false;
  showNatModal = false;

  // Forms
  ipPoolForm: FormGroup;
  metroIpForm: FormGroup;
  routeForm: FormGroup;
  natForm: FormGroup;

  // IP Preview
  ipPreview: any[] = [];
  metroIpPreview: any[] = [];
  routeTargetMetroIp: MetroIP | null = null;
  natTargetMetroIp: MetroIP | null = null;
  userOptions: any[] = [];
  routingInProgress = false;
  natInProgress = false;
  natLoadingExisting = false;
  existingNatSummary = '';
  existingNatHasRules = false;
  natServiceOptions = [
    { key: 'http', label: 'HTTP (80)' },
    { key: 'https', label: 'HTTPS (443)' },
    { key: 'ssh', label: 'SSH (22)' },
    { key: 'rdp', label: 'RDP (3389)' },
    { key: 'winbox', label: 'Winbox (8291)' },
    { key: 'dns', label: 'DNS (53 TCP/UDP)' },
    { key: 'smtp', label: 'SMTP (25)' },
    { key: 'smtps', label: 'SMTPS (465)' },
    { key: 'submission', label: 'SMTP Submission (587)' },
    { key: 'pop3', label: 'POP3 (110)' },
    { key: 'imap', label: 'IMAP (143)' },
    { key: 'imaps', label: 'IMAPS (993)' },
    { key: 'ftp', label: 'FTP (21)' }
  ];
  selectedNatServices: string[] = [];
  customNatRules: Array<{ protocol: 'tcp' | 'udp'; port: string }> = [];

  constructor(
    private ipService: IpService,
    private tenantService: TenantService,
    private nasService: NasService,
    private userService: UserService,
    private fb: FormBuilder,
    private translate: TranslateService
  ) {
    this.ipPoolForm = this.createIpPoolForm();
    this.metroIpForm = this.createMetroIpForm();
    this.routeForm = this.createRouteForm();
    this.natForm = this.createNatForm();
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

  /** Port-split shared rows (e.g. .109 ×100) count as one logical WAN IP in stats */
  private getLogicalMetroIPsForStats(metroIPs: MetroIP[]): MetroIP[] {
    const logical: MetroIP[] = [];
    const poolSegments = new Map<string, MetroIP[]>();

    for (const metro of metroIPs) {
      if (this.isPortSegmentedSharedIp(metro)) {
        const key = `${metro.nasname}::${metro.ipaddress}`;
        if (!poolSegments.has(key)) {
          poolSegments.set(key, []);
        }
        poolSegments.get(key)!.push(metro);
      } else {
        logical.push(metro);
      }
    }

    for (const segments of poolSegments.values()) {
      const head = segments[0];
      const assigned = segments.find((s) => this.isMetroUserAssigned(s.user));
      logical.push({
        ...head,
        user: assigned?.user ?? '',
        pool_segment_count: segments.length
      });
    }

    return logical;
  }

  loadMetroIpStats(): void {
    this.ipService.getMetroIPs({
      page: 1,
      limit: 10000,
      search: this.searchTerm,
      tenantId: this.selectedTenantId,
      metroIpFilter: this.metroIpFilter,
      ipAddressFilter: this.ipAddressFilter,
      nasNameFilter: this.nasNameFilter,
      routerNatSync: false
    }).subscribe({
      next: (response) => {
        if (response.success) {
          const metroIPs = response.data.metroips || [];
          const logicalIPs = this.getLogicalMetroIPsForStats(metroIPs);
          const staticIPs = logicalIPs.filter(
            (metro) => Number(metro.ip_type) === 0 && !this.isMetroBlockEntry(metro)
          );
          const sharedIPs = logicalIPs.filter((metro) => Number(metro.ip_type) === 1);

          this.metroIpStats = {
            total: logicalIPs.length,
            available: logicalIPs.filter((metro) => !this.isMetroIpInUse(metro)).length,
            inUse: logicalIPs.filter((metro) => this.isMetroIpInUse(metro)).length,
            static: staticIPs.length,
            staticAvailable: staticIPs.filter((metro) => !this.isMetroIpInUse(metro)).length,
            staticInUse: staticIPs.filter((metro) => this.isMetroIpInUse(metro)).length,
            shared: sharedIPs.length,
            sharedAvailable: sharedIPs.filter((metro) => !this.isMetroIpInUse(metro)).length,
            sharedInUse: sharedIPs.filter((metro) => this.isMetroIpInUse(metro)).length
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
          const pagination = response.data.pagination;
          this.totalMetroItems = pagination?.total || 0;
          this.totalPages = pagination?.pages || 0;
          const apiPage = pagination?.page || this.currentPage;

          if (this.totalPages > 0 && apiPage !== this.currentPage) {
            this.currentPage = apiPage;
            if (!this.pageClampRetry) {
              this.pageClampRetry = true;
              this.loadMetroIPs();
              return;
            }
          }
          this.pageClampRetry = false;

          this.metroIPs = response.data.metroips || [];
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
    this.pageClampRetry = false;
    this.loadData();
  }

  onMetroIpFilterChange(): void {
    this.currentPage = 1;
    this.pageClampRetry = false;
    this.loadData();
  }

  applyMetroIpFilters(): void {
    this.onSearch();
  }

  clearMetroIpFilters(): void {
    this.metroIpFilter = '';
    this.ipAddressFilter = '';
    this.nasNameFilter = '';
    this.currentPage = 1;
    this.pageClampRetry = false;
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
    if (page < 1 || (this.totalPages > 0 && page > this.totalPages)) {
      return;
    }
    this.currentPage = page;
    this.pageClampRetry = false;
    this.loadData();
  }

  getPaginationTotal(): number {
    return this.activeTab === 'metroips' ? this.totalMetroItems : this.totalPools;
  }

  getPaginationFrom(): number {
    const total = this.getPaginationTotal();
    if (total === 0) {
      return 0;
    }
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getPaginationTo(): number {
    return this.getMin(this.currentPage * this.pageSize, this.getPaginationTotal());
  }

  showPagination(): boolean {
    return !this.loading && this.getPaginationTotal() > 0 && this.totalPages > 1;
  }

  onTabChange(tab: string): void {
    this.activeTab = tab;
    this.currentPage = 1;
    this.searchTerm = '';
    this.loadData();
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const windowSize = 5;

    if (this.totalPages <= 0) {
      return pages;
    }

    const halfWindow = Math.floor(windowSize / 2);
    let startPage = Math.max(1, this.currentPage - halfWindow);
    let endPage = startPage + windowSize - 1;

    if (endPage > this.totalPages) {
      endPage = this.totalPages;
      startPage = Math.max(1, endPage - windowSize + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
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
      return 'ip_management.in_use';
    }
    return 'ip_management.available';
  }

  getMetroIpStatusBadgeClass(metroIP: MetroIP): string {
    if (this.isMetroBlockEntry(metroIP)) {
      return 'badge-secondary';
    }
    if (this.isMetroIpInUse(metroIP)) {
      return 'badge badge-danger'; // In Use - Red
    }
    return 'badge badge-success'; // Available - Green
  }

  getMetroIpStatusText(metroIP: MetroIP): string {
    if (this.isMetroIpInUse(metroIP)) {
      return 'ip_management.metro_status_occupied';
    }
    return 'ip_management.metro_status_free';
  }

  private isMetroUserAssigned(userValue: any): boolean {
    if (userValue === null || userValue === undefined) {
      return false;
    }

    const normalized = String(userValue).trim().toLowerCase();
    return normalized !== '' && normalized !== '-' && normalized !== 'null';
  }

  private isMetroIpInUse(metroIP: MetroIP): boolean {
    if (this.isMetroBlockEntry(metroIP)) {
      return true;
    }
    if (this.isPortSegmentedSharedIp(metroIP)) {
      return this.isMetroUserAssigned(metroIP?.user);
    }
    return this.isMetroUserAssigned(metroIP?.user) || this.isMetroManagedNatEntry(metroIP);
  }

  isPortSegmentedSharedIp(metroIP: MetroIP): boolean {
    if (!metroIP) {
      return false;
    }
    if (metroIP.is_shared_src_pool === true) {
      return true;
    }

    const ports = String(metroIP?.ports || '').trim();
    if (!ports || ports === '-') {
      return false;
    }
    if (ports === '1-65000' || ports === '1-65535') {
      return false;
    }

    return Number(metroIP?.ip_type) === 1 && /^\d+-\d+$/.test(ports);
  }

  isMetroManagedNatEntry(metroIP: MetroIP): boolean {
    if (
      !metroIP?.nat_in_use ||
      this.isMetroBlockEntry(metroIP) ||
      this.isMetroRoutedEntry(metroIP) ||
      this.isPortSegmentedSharedIp(metroIP)
    ) {
      return false;
    }
    if (metroIP.nat_has_dst === true) {
      return true;
    }
    if (Array.isArray(metroIP.nat_dst_ports) && metroIP.nat_dst_ports.length > 0) {
      return true;
    }
    const natType = String(metroIP.nat_type || '').toLowerCase();
    if (natType === 'dst' || natType === 'both') {
      return true;
    }
    if (metroIP.nat_src_full && !metroIP.nat_has_dst) {
      return false;
    }
    return metroIP.nat_in_use === true;
  }

  canRouteMetroIp(metroIP: MetroIP): boolean {
    if (this.isMetroBlockEntry(metroIP) || this.isPortSegmentedSharedIp(metroIP)) {
      return false;
    }
    return !this.isMetroIpInUse(metroIP);
  }

  canManageNat(metroIP: MetroIP): boolean {
    if (this.isMetroBlockEntry(metroIP) || this.isPortSegmentedSharedIp(metroIP)) {
      return false;
    }
    return this.canRouteMetroIp(metroIP) || metroIP?.nat_in_use === true;
  }

  canClearRoute(metroIP: MetroIP): boolean {
    if (this.isMetroBlockEntry(metroIP) || this.isPortSegmentedSharedIp(metroIP)) {
      return false;
    }
    return metroIP?.binding_type === 'routed' && this.isMetroUserAssigned(metroIP?.user);
  }

  isMetroRoutedEntry(metroIP: MetroIP): boolean {
    if (this.isMetroBlockEntry(metroIP) || this.isPortSegmentedSharedIp(metroIP)) {
      return false;
    }
    return Number(metroIP?.ip_type) === METRO_IP_TYPE_ROUTED;
  }

  isMetroNatEntry(metroIP: MetroIP): boolean {
    return this.isMetroManagedNatEntry(metroIP);
  }

  isMetroSharedSrcPoolEntry(metroIP: MetroIP): boolean {
    return this.isPortSegmentedSharedIp(metroIP);
  }

  shouldShowBindingBadge(metroIP: MetroIP): boolean {
    if (
      this.isMetroBlockEntry(metroIP) ||
      this.isMetroRoutedEntry(metroIP) ||
      this.isMetroNatEntry(metroIP)
    ) {
      return false;
    }
    return !this.canRouteMetroIp(metroIP);
  }

  getMetroIpTypeLabel(metroIP: MetroIP): string {
    if (this.isMetroBlockEntry(metroIP)) {
      return 'ip_management.block_cidr';
    }
    if (this.isMetroSharedSrcPoolEntry(metroIP)) {
      return 'ip_management.shared_src';
    }
    if (this.isMetroRoutedEntry(metroIP)) {
      return 'ip_management.routed';
    }
    if (this.isMetroNatEntry(metroIP)) {
      return 'ip_management.type_nat';
    }
    if (Number(metroIP.ip_type) === 1) {
      return 'ip_management.shared';
    }
    return 'ip_management.static';
  }

  getMetroIpTypeBadgeClass(metroIP: MetroIP): string {
    if (this.isMetroBlockEntry(metroIP)) {
      return 'badge badge-block';
    }
    if (this.isMetroSharedSrcPoolEntry(metroIP)) {
      return 'badge badge-shared-src';
    }
    if (this.isMetroRoutedEntry(metroIP)) {
      return 'badge badge-routed';
    }
    if (this.isMetroNatEntry(metroIP)) {
      return 'badge badge-nat';
    }
    if (Number(metroIP.ip_type) === 1) {
      return 'badge badge-warning';
    }
    return 'badge badge-info';
  }

  getMetroIpRouteInfo(metroIP: MetroIP): string {
    if (this.isMetroBlockEntry(metroIP)) {
      const note = (metroIP.notes || metroIP.block_label || '').trim();
      const hosts =
        metroIP.block_host_count != null
          ? this.tr('ip_management.block_hosts_suffix', {
              count: metroIP.block_host_count
            })
          : '';
      return note
        ? `${note}${hosts}`
        : `${this.tr('ip_management.block_reserved')}${hosts}`;
    }
    if (metroIP?.nat_in_use === true && !this.isMetroUserAssigned(metroIP.user)) {
      if (metroIP.nat_summary) {
        return metroIP.nat_summary;
      }
      return metroIP?.nat_local_ip
        ? this.tr('ip_management.nat_in_use_with_local', { ip: metroIP.nat_local_ip })
        : this.tr('ip_management.nat_in_use_label');
    }

    if (!this.isMetroIpInUse(metroIP)) {
      return this.tr('ip_management.route_not_routed');
    }

    if (metroIP.binding_type === 'routed') {
      return this.tr('ip_management.route_routed_to', { user: metroIP.user });
    }

    return this.tr('ip_management.route_assigned_to', { user: metroIP.user });
  }

  getMetroIpBindingLabel(metroIP: MetroIP): string {
    if (this.isPortSegmentedSharedIp(metroIP)) {
      return 'ip_management.binding_shared_port_ip';
    }

    if (metroIP?.nat_in_use === true && !this.isMetroUserAssigned(metroIP.user)) {
      if (metroIP.nat_type === 'both' && metroIP.nat_src_full) {
        return 'ip_management.binding_src_full_dst';
      }
      if (metroIP.nat_type === 'src' || metroIP.nat_src_full) {
        return 'ip_management.binding_src_full';
      }
      return 'ip_management.binding_nat_in_use';
    }

    if (!this.isMetroIpInUse(metroIP)) {
      return 'ip_management.binding_unassigned';
    }

    return metroIP.binding_type === 'routed'
      ? 'ip_management.binding_routed'
      : 'ip_management.binding_assigned';
  }

  private tr(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params);
  }

  getMin(a: number, b: number): number {
    return Math.min(a, b);
  }

  editMetroIpNotes(metroIp: MetroIP): void {
    const current = metroIp.notes || '';
    const updated = window.prompt(this.tr('ip_management.notes_prompt'), current);
    if (updated === null) {
      return;
    }

    this.ipService.updateMetroIP(metroIp.id, { notes: updated.trim() }).subscribe({
      next: (response) => {
        if (response?.success) {
          metroIp.notes = updated.trim() || undefined;
          const sync = response?.data?.routerSync;
          if (this.isMetroBlockEntry(metroIp) || sync?.reason === 'block_reserve') {
            alert(this.tr('ip_management.alert_notes_saved'));
          } else if (sync && !sync.skipped && !sync.error) {
            alert(
              this.tr('ip_management.alert_notes_saved_sync', {
                nat: sync.updatedNat || 0,
                routes: sync.updatedRoutes || 0
              })
            );
          } else if (sync?.error) {
            alert(
              this.tr('ip_management.alert_notes_saved_sync_failed', {
                error: sync.error
              })
            );
          } else if (sync?.skipped) {
            alert(this.tr('ip_management.alert_notes_saved'));
          }
        } else {
          alert(response?.message || this.tr('ip_management.alert_notes_update_failed'));
        }
      },
      error: (error) => {
        console.error('Update notes error:', error);
        alert(error?.error?.message || this.tr('ip_management.alert_notes_update_failed'));
      }
    });
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
      add_mode: ['expand', Validators.required],
      nas_id: ['', Validators.required],
      ipaddress: ['', Validators.required],
      client_count: [''],
      ip_type: ['', Validators.required],
      reserve_label: [''],
      tenant_id: ['']
    });
  }

  isBlockReserveMode(): boolean {
    return this.metroIpForm.get('add_mode')?.value === 'block_reserve';
  }

  isMetroBlockEntry(metroIP: MetroIP): boolean {
    return Number(metroIP?.ip_type) === METRO_IP_TYPE_BLOCK || metroIP?.is_block === true;
  }

  private createRouteForm(): FormGroup {
    return this.fb.group({
      routerId: ['', Validators.required],
      username: ['', Validators.required],
      notes: ['']
    });
  }

  private createNatForm(): FormGroup {
    return this.fb.group({
      routerId: ['', Validators.required],
      username: [''],
      natLocalIp: ['', Validators.required],
      natType: ['both'],
      dstNatServiceMode: ['none']
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

  openRouteModal(metroIp: MetroIP): void {
    if (!this.canRouteMetroIp(metroIp) && !this.canClearRoute(metroIp)) {
      if (this.isPortSegmentedSharedIp(metroIp)) {
        alert(this.tr('ip_management.alert_route_not_allowed_port_split'));
      }
      return;
    }

    this.closeNatModal();
    this.routeTargetMetroIp = metroIp;
    this.showRouteModal = true;
    this.routeForm = this.createRouteForm();
    if (metroIp.notes) {
      this.routeForm.patchValue({ notes: metroIp.notes });
    }
    const matchedRouter = this.nasDevices.find(
      (nas) => nas.shortname === metroIp.nasname || nas.nasname === metroIp.nasname
    );
    if (matchedRouter) {
      this.routeForm.patchValue({ routerId: matchedRouter.id });
    }
    this.userOptions = [];
    this.routingInProgress = false;
    this.loadRouteUsers();
  }

  closeRouteModal(): void {
    this.showRouteModal = false;
    this.routeTargetMetroIp = null;
    this.routeForm.reset();
    this.userOptions = [];
    this.routingInProgress = false;
  }

  openNatModal(metroIp: MetroIP): void {
    if (!this.canManageNat(metroIp)) {
      if (this.isPortSegmentedSharedIp(metroIp)) {
        alert(this.tr('ip_management.alert_nat_not_allowed_port_split'));
      }
      return;
    }

    this.closeRouteModal();
    this.natTargetMetroIp = metroIp;
    this.showNatModal = true;
    this.natForm = this.createNatForm();
    this.userOptions = [];
    this.natInProgress = false;
    this.selectedNatServices = [];
    this.customNatRules = [];

    if (this.isMetroUserAssigned(metroIp.user)) {
      this.natForm.patchValue({ username: metroIp.user });
    }

    const matchedRouter = this.nasDevices.find(
      nas => nas.shortname === metroIp.nasname || nas.nasname === metroIp.nasname
    );
    if (matchedRouter) {
      this.natForm.patchValue({ routerId: matchedRouter.id });
      this.loadExistingNatConfig();
    }

    this.loadRouteUsers();
  }

  closeNatModal(): void {
    this.showNatModal = false;
    this.natTargetMetroIp = null;
    this.natForm.reset();
    this.natForm.patchValue({
      natType: 'both',
      dstNatServiceMode: 'none'
    });
    this.userOptions = [];
    this.natInProgress = false;
    this.natLoadingExisting = false;
    this.existingNatSummary = '';
    this.existingNatHasRules = false;
    this.selectedNatServices = [];
    this.customNatRules = [];
  }

  onNatRouterChange(): void {
    this.loadExistingNatConfig();
  }

  private loadExistingNatConfig(): void {
    if (!this.natTargetMetroIp) {
      return;
    }

    const routerId = Number(this.natForm.get('routerId')?.value);
    if (!routerId) {
      this.existingNatSummary = '';
      this.existingNatHasRules = false;
      return;
    }

    this.natLoadingExisting = true;
    this.existingNatSummary = '';

    this.ipService.getMetroIpNatConfig(this.natTargetMetroIp.id, routerId).subscribe({
      next: (response) => {
        this.natLoadingExisting = false;
        if (!response?.success || !response.data) {
          return;
        }

        const config = response.data;
        this.existingNatHasRules = Boolean(config.hasExisting);
        if (!config.hasExisting) {
          this.existingNatSummary = 'No existing NAT rules found on router for this public IP.';
          return;
        }

        this.natForm.patchValue({
          natLocalIp: config.natLocalIp || this.natForm.get('natLocalIp')?.value,
          natType: config.natType || 'both',
          dstNatServiceMode: config.dstNatServiceMode || 'none'
        });

        this.selectedNatServices = [...(config.selectedServices || [])];
        this.customNatRules = (config.customNatRules || []).map(rule => ({
          protocol: rule.protocol === 'udp' ? 'udp' : 'tcp',
          port: String(rule.port || '')
        }));

        const portsText = (config.existingPorts || []).join(', ');
        this.existingNatSummary = config.summary
          || `Loaded ${config.existingRuleCount} rule(s) from router.${portsText ? ` Ports: ${portsText}` : ''}`;
      },
      error: (error) => {
        this.natLoadingExisting = false;
        console.error('Load existing NAT config error:', error);
        this.existingNatSummary = 'Could not load existing NAT rules from router.';
        this.existingNatHasRules = false;
      }
    });
  }

  private loadRouteUsers(): void {
    this.userService.getUsers(1, 1000, '', this.selectedTenantId || undefined).subscribe({
      next: (response) => {
        if (response?.success) {
          this.userOptions = response.data?.users || [];
        }
      },
      error: (error) => {
        console.error('Error loading users for routing:', error);
      }
    });
  }

  onDstNatServiceModeChange(): void {
    const mode = this.natForm.get('dstNatServiceMode')?.value;
    if (mode !== 'selected') {
      this.selectedNatServices = [];
    }
    if (mode !== 'custom') {
      this.customNatRules = [];
    }
  }

  onNatTypeChange(): void {
    const natType = this.natForm.get('natType')?.value;
    if (natType === 'src') {
      this.natForm.patchValue({ dstNatServiceMode: 'none' });
      this.selectedNatServices = [];
      this.customNatRules = [];
    }
  }

  toggleNatService(serviceKey: string): void {
    if (this.selectedNatServices.includes(serviceKey)) {
      this.selectedNatServices = this.selectedNatServices.filter(key => key !== serviceKey);
      return;
    }
    this.selectedNatServices = [...this.selectedNatServices, serviceKey];
  }

  addCustomNatRule(): void {
    this.customNatRules = [...this.customNatRules, { protocol: 'tcp', port: '' }];
  }

  removeCustomNatRule(index: number): void {
    this.customNatRules = this.customNatRules.filter((_, i) => i !== index);
  }

  updateCustomNatRulePort(index: number, port: string): void {
    this.customNatRules = this.customNatRules.map((rule, i) =>
      i === index ? { ...rule, port } : rule
    );
  }

  updateCustomNatRuleProtocol(index: number, protocol: 'tcp' | 'udp'): void {
    this.customNatRules = this.customNatRules.map((rule, i) =>
      i === index ? { ...rule, protocol } : rule
    );
  }

  private isNatFormReadyForSubmit(): boolean {
    if (!this.natTargetMetroIp || this.natForm.invalid || this.natInProgress) {
      return false;
    }

    const natType = this.natForm.get('natType')?.value;
    const dstNatServiceMode = this.natForm.get('dstNatServiceMode')?.value;
    const natLocalIp = String(this.natForm.get('natLocalIp')?.value || '').trim();

    if (!natLocalIp) {
      return false;
    }

    const needsDstConfig = (natType === 'dst' || natType === 'both') && dstNatServiceMode !== 'none';
    if (!needsDstConfig) {
      return true;
    }

    if (dstNatServiceMode === 'selected' && this.selectedNatServices.length === 0) {
      return false;
    }

    if (dstNatServiceMode === 'custom') {
      if (this.customNatRules.length === 0) {
        return false;
      }
      return this.customNatRules.every(rule => String(rule.port || '').trim() !== '');
    }

    return true;
  }

  routeSelectedMetroIp(): void {
    if (!this.routeTargetMetroIp || this.routeForm.invalid || this.routingInProgress) {
      return;
    }

    const targetMetroIp = this.routeTargetMetroIp;
    const { routerId, username, notes } = this.routeForm.value;
    this.routingInProgress = true;

    const payload: { routerId: number; username: string; notes?: string } = {
      routerId: Number(routerId),
      username: String(username)
    };
    const noteText = String(notes || '').trim();
    if (noteText) {
      payload.notes = noteText;
    }

    this.ipService.routeMetroIP(targetMetroIp.id, payload).subscribe({
      next: (response) => {
        this.routingInProgress = false;
        if (response?.success) {
          this.closeRouteModal();
          this.loadMetroIPs();
          alert(
            this.tr('ip_management.alert_route_created', {
              ip: targetMetroIp.ipaddress,
              user: username
            })
          );
        } else {
          alert(response?.message || this.tr('ip_management.alert_route_operation_failed'));
        }
      },
      error: (error) => {
        this.routingInProgress = false;
        console.error('Route metro IP error:', error);
        alert(error?.error?.message || this.tr('ip_management.alert_route_operation_failed'));
      }
    });
  }

  clearRouteFromMetroIp(): void {
    const targetMetroIp = this.routeTargetMetroIp;
    if (!targetMetroIp || this.routingInProgress) {
      return;
    }

    if (!this.canClearRoute(targetMetroIp)) {
      alert(this.tr('ip_management.alert_route_clear_routed_only'));
      return;
    }

    const routerId = Number(this.routeForm.get('routerId')?.value);
    if (!routerId) {
      alert(this.tr('ip_management.alert_select_router_first'));
      return;
    }

    this.routingInProgress = true;
    this.ipService.clearMetroIpRoute(targetMetroIp.id, routerId).subscribe({
      next: (response) => {
        this.routingInProgress = false;
        if (response?.success) {
          const deleted = response?.data?.deletedRoutes || 0;
          this.closeRouteModal();
          this.loadMetroIPs();
          alert(
            this.tr('ip_management.alert_route_cleared', {
              ip: targetMetroIp.ipaddress,
              count: deleted
            })
          );
        } else {
          alert(response?.message || this.tr('ip_management.alert_route_clear_failed'));
        }
      },
      error: (error) => {
        this.routingInProgress = false;
        console.error('Clear route error:', error);
        alert(error?.error?.message || this.tr('ip_management.alert_route_clear_failed'));
      }
    });
  }

  applyNatToMetroIp(): void {
    if (!this.isNatFormReadyForSubmit()) {
      return;
    }

    const targetMetroIp = this.natTargetMetroIp;
    if (!targetMetroIp) {
      return;
    }

    const { routerId, username, natType, natLocalIp, dstNatServiceMode } = this.natForm.value;
    this.natInProgress = true;

    const payload: NatMetroIpRequest = {
      routerId: Number(routerId),
      natLocalIp: String(natLocalIp || '').trim(),
      natType,
      dstNatServiceMode,
      selectedServices: [...this.selectedNatServices],
      customNatRules: this.customNatRules
        .map(rule => ({
          protocol: rule.protocol,
          port: String(rule.port || '').trim()
        }))
        .filter(rule => rule.port !== ''),
      replaceExisting: true
    };

    const normalizedUsername = String(username || '').trim();
    if (normalizedUsername) {
      payload.username = normalizedUsername;
    }

    this.ipService.natMetroIP(targetMetroIp.id, payload).subscribe({
      next: (response) => {
        this.natInProgress = false;
        if (response?.success) {
          this.closeNatModal();
          const removed = response?.data?.nat?.removedExisting || 0;
          const created = (response?.data?.nat?.createdNatRules || []).filter((rule: any) => !rule.skipped).length;
          alert(
            this.tr('ip_management.alert_nat_updated', {
              ip: targetMetroIp.ipaddress,
              removed,
              created
            })
          );
        } else {
          alert(response?.message || this.tr('ip_management.alert_nat_operation_failed'));
        }
      },
      error: (error) => {
        this.natInProgress = false;
        console.error('NAT metro IP error:', error);
        alert(error?.error?.message || this.tr('ip_management.alert_nat_operation_failed'));
      }
    });
  }

  clearNatFromMetroIp(): void {
    const targetMetroIp = this.natTargetMetroIp;
    if (!targetMetroIp || this.natInProgress) {
      return;
    }

    const routerId = Number(this.natForm.get('routerId')?.value);
    if (!routerId) {
      alert(this.tr('ip_management.alert_select_router_first'));
      return;
    }

    this.natInProgress = true;
    this.ipService.clearMetroIpNat(targetMetroIp.id, routerId).subscribe({
      next: (response) => {
        this.natInProgress = false;
        if (response?.success) {
          const deleted = response?.data?.deletedRules || 0;
          this.closeNatModal();
          this.loadMetroIPs();
          alert(
            this.tr('ip_management.alert_nat_cleared', {
              ip: targetMetroIp.ipaddress,
              count: deleted
            })
          );
        } else {
          alert(response?.message || this.tr('ip_management.alert_nat_clear_failed'));
        }
      },
      error: (error) => {
        this.natInProgress = false;
        console.error('Clear NAT error:', error);
        alert(error?.error?.message || this.tr('ip_management.alert_nat_clear_failed'));
      }
    });
  }

  canSubmitRouteForm(): boolean {
    return Boolean(this.routeTargetMetroIp) && this.routeForm.valid && !this.routingInProgress;
  }

  canSubmitNatForm(): boolean {
    return this.isNatFormReadyForSubmit();
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

  onMetroAddModeChange(): void {
    const mode = this.metroIpForm.get('add_mode')?.value;
    if (mode === 'block_reserve') {
      this.metroIpForm.patchValue({ ip_type: String(METRO_IP_TYPE_BLOCK), client_count: '' });
      this.metroIpForm.get('reserve_label')?.setValidators([Validators.required, Validators.maxLength(50)]);
      this.metroIpForm.get('ip_type')?.clearValidators();
    } else {
      this.metroIpForm.get('reserve_label')?.clearValidators();
      this.metroIpForm.get('ip_type')?.setValidators([Validators.required]);
      if (!this.metroIpForm.get('ip_type')?.value || this.metroIpForm.get('ip_type')?.value === String(METRO_IP_TYPE_BLOCK)) {
        this.metroIpForm.patchValue({ ip_type: '0' });
      }
    }
    this.metroIpForm.get('reserve_label')?.updateValueAndValidity();
    this.metroIpForm.get('ip_type')?.updateValueAndValidity();
    this.calculateMetroIpRange();
  }

  // Metro IP Range Calculation
  calculateMetroIpRange(): void {
    const nasId = this.metroIpForm.get('nas_id')?.value;
    const ipaddress = this.metroIpForm.get('ipaddress')?.value;
    const clientCount = this.metroIpForm.get('client_count')?.value;
    const ipType = this.metroIpForm.get('ip_type')?.value;
    const addMode = this.metroIpForm.get('add_mode')?.value;

    if (addMode === 'block_reserve' && nasId && ipaddress) {
      const selectedNas = this.nasDevices.find((nas) => nas.id === parseInt(nasId, 10));
      if (!selectedNas) {
        this.metroIpPreview = [];
        return;
      }
      const cidr = String(ipaddress).trim();
      if (!/^\d{1,3}(?:\.\d{1,3}){3}\/\d{1,2}$/.test(cidr)) {
        this.metroIpPreview = [];
        return;
      }
      const note = String(this.metroIpForm.get('reserve_label')?.value || '').trim()
        || this.tr('ip_management.default_reserve_label');
      this.metroIpPreview = [
        {
          nasname: selectedNas.shortname || selectedNas.nasname,
          ipaddress: cidr,
          ports: '-',
          ip_type: METRO_IP_TYPE_BLOCK,
          user: null,
          notes: note,
          is_block: true
        }
      ];
      return;
    }

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
                alert(
                  this.tr('ip_management.alert_ip_pools_created_success', { count: completed })
                );
              } else {
                alert(
                  this.tr('ip_management.alert_ip_pools_created_partial', {
                    completed,
                    errors
                  })
                );
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
                alert(this.tr('ip_management.alert_ip_pools_create_failed'));
              } else {
                alert(
                  this.tr('ip_management.alert_ip_pools_created_partial', {
                    completed,
                    errors
                  })
                );
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
    const addMode = formData.add_mode;

    if (addMode === 'block_reserve') {
      if (!formData.nas_id || !formData.ipaddress || !formData.reserve_label) {
        alert(this.tr('ip_management.alert_block_reserve_required'));
        return;
      }
      const selectedNas = this.nasDevices.find((nas) => nas.id === parseInt(formData.nas_id, 10));
      if (!selectedNas) return;

      let tenantId = this.selectedTenantId;
      if (this.isSuperAdmin && formData.tenant_id) {
        tenantId = formData.tenant_id;
      }

      this.ipService
        .createMetroIP({
          add_mode: 'block_reserve',
          nasname: selectedNas.shortname || selectedNas.nasname,
          ipaddress: String(formData.ipaddress).trim(),
          notes: String(formData.reserve_label).trim(),
          tenant_id: tenantId,
          ip_type: METRO_IP_TYPE_BLOCK
        })
        .subscribe({
          next: (response) => {
            if (response.success) {
              alert(response.message || this.tr('ip_management.alert_block_reserved'));
              this.closeMetroIpModal();
              this.loadData();
            }
          },
          error: (error) => {
            alert(error?.error?.message || this.tr('ip_management.alert_block_reserve_failed'));
          }
        });
      return;
    }

    const ipType = formData.ip_type;
    let isValid = formData.nas_id && formData.ipaddress && formData.ip_type;
    if (ipType === '1') {
      isValid = isValid && formData.client_count;
    }

    if (isValid && this.metroIpPreview.length > 0) {
      const selectedNas = this.nasDevices.find((nas) => nas.id === parseInt(formData.nas_id, 10));
      if (!selectedNas) return;

      let tenantId = this.selectedTenantId;
      if (this.isSuperAdmin && formData.tenant_id) {
        tenantId = formData.tenant_id;
      }

      const items = this.metroIpPreview.map((metroIP) => ({
        ...metroIP,
        tenant_id: tenantId
      }));

      this.ipService.createMetroIPsBulk(items, tenantId).subscribe({
        next: (response) => {
          if (response.success) {
            alert(
              response.message ||
                this.tr('ip_management.alert_metro_ips_created', {
                  count: response.data?.count || items.length
                })
            );
            this.closeMetroIpModal();
            this.loadData();
          }
        },
        error: (error) => {
          alert(error?.error?.message || this.tr('ip_management.alert_metro_ips_create_failed'));
        }
      });
    } else {
      alert(this.tr('ip_management.alert_fill_required_preview'));
    }
  }
}
