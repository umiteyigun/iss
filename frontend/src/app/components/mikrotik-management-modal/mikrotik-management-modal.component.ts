import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { NasService } from '../../services/nas.service';
import { InterfaceDetailModalComponent } from '../interface-detail-modal/interface-detail-modal.component';

export interface MikrotikManagementData {
  interfaces: any[];
  ipAddresses: any[];
  pppoeSecrets: any[];
  systemInfo: any;
  logs: any[];
  routes: any[];
  firewallRules: any[];
  natRules: any[];
  pppProfiles: any[];
  activePppSessions: any[];
  systemLogs: any[];
  identity: any;
  pingResults: any[];
  tracerouteResults: any[];
  netwatchResults: any[];
  dhcpServerLeases: any[];
  dhcpClientLeases: any[];
  dnsRecords: any[];
  dnsSettings: any;
  dnsStaticRecords: any[];
  arpEntries: any[];
  neighborEntries: any[];
}

@Component({
  selector: 'app-mikrotik-management-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, InterfaceDetailModalComponent],
  templateUrl: './mikrotik-management-modal.component.html',
  styleUrls: ['./mikrotik-management-modal.component.scss']
})
export class MikrotikManagementModalComponent implements OnInit, OnDestroy, OnChanges {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);

  @Input() isOpen = false;
  @Input() nasDevice: any = null;
  @Output() close = new EventEmitter<void>();

  loading = false;
  error: string | null = null;
  activeSection = 'interfaces';
  autoRefresh = false;
  refreshInterval = 5000;
  
  openMenus: Set<string> = new Set();
  activeFirewallTab = 'filter'; // Track active firewall tab
  
  // Loading states for each tab
  firewallLoading = {
    filter: false,
    nat: false,
    mangle: false,
    raw: false,
    connections: false
  };

  // DNS Edit properties
  editingDns = false;
  dnsEditForm: FormGroup = null as any;
  dnsLoading = false;

  // DNS Static Records properties
  editingDnsRecord = false;
  addingDnsRecord = false;
  dnsRecordForm: FormGroup = null as any;
  selectedDnsRecord: any = null;
  dnsRecordLoading = false;
  managementData: MikrotikManagementData | null = null;
  lastUpdate: Date | null = null;
  
  get interfaceData(): any[] {
    return this.managementData?.interfaces || [];
  }

  customUsername = '';
  customPassword = '';
  useCustomCredentials = false;

  pingTarget = '';
  tracerouteTarget = '';
  
  private refreshTimer: any = null;

  selectedInterface: any = null;
  showInterfaceDetail = false;

  // PPPoE Secrets CRUD properties
  showPppoeSecretModal = false;
  isEditingPppoeSecret = false;
  currentPppoeSecret: any = null;
  pppoeSecretForm!: FormGroup;
  isPppoeSecretLoading = false;
  pppProfiles: any[] = [];

  showAddressModal = false;
  isEditingAddress = false;
  currentAddress: any = null;
  addressForm!: FormGroup;
  availableInterfaces: any[] = [];
  isAddressLoading = false;
  isInterfaceLoading = false;

  showRouteModal = false;
  isEditingRoute = false;
  currentRoute: any = null;
  routeForm!: FormGroup;
  isRouteLoading = false;

  constructor(
    private nasService: NasService
  ) {
    // Initialize forms in constructor to ensure FormBuilder is available
    this.initializeAddressForm();
    this.initializeRouteForm();
    this.initializePppoeSecretForm();
  }

  get nasId(): number | null {
    return this.nasDevice?.id || null;
  }

  get username(): string {
    return this.nasDevice?.ruser || 'admin';
  }

  get password(): string {
    return this.nasDevice?.naspassword || this.nasDevice?.secret || '';
  }

  menuItems = [
    { id: 'interfaces', name: 'Interfaces', icon: 'fas fa-network-wired', children: [
      { id: 'ethernet', name: 'Ethernet', icon: 'fas fa-ethernet' },
      { id: 'wireless', name: 'Wireless', icon: 'fas fa-wifi' },
      { id: 'bridge', name: 'Bridge', icon: 'fas fa-link' },
      { id: 'vlan', name: 'VLAN', icon: 'fas fa-layer-group' },
      { id: 'bond', name: 'Bonding', icon: 'fas fa-link' },
      { id: 'pppoe-out', name: 'PPPoE Client', icon: 'fas fa-plug' },
      { id: 'pppoe-in', name: 'PPPoE Server', icon: 'fas fa-server' },
      { id: 'vpn', name: 'VPN', icon: 'fas fa-shield-alt' },
      { id: 'tunnel', name: 'Tunnel', icon: 'fas fa-tunnel' },
      { id: 'vrrp', name: 'VRRP', icon: 'fas fa-sync-alt' },
      { id: 'loopback', name: 'Loopback', icon: 'fas fa-circle' },
      { id: 'ovpn-out', name: 'OpenVPN Client', icon: 'fas fa-key' },
      { id: 'ovpn-in', name: 'OpenVPN Server', icon: 'fas fa-server' },
      { id: 'sstp-out', name: 'SSTP Client', icon: 'fas fa-lock' },
      { id: 'sstp-in', name: 'SSTP Server', icon: 'fas fa-server' },
      { id: 'l2tp-out', name: 'L2TP Client', icon: 'fas fa-network-wired' },
      { id: 'l2tp-in', name: 'L2TP Server', icon: 'fas fa-server' },
      { id: 'pptp-out', name: 'PPTP Client', icon: 'fas fa-network-wired' },
      { id: 'pptp-in', name: 'PPTP Server', icon: 'fas fa-server' },
      { id: 'gre', name: 'GRE Tunnel', icon: 'fas fa-tunnel' },
      { id: 'eoip', name: 'EoIP Tunnel', icon: 'fas fa-tunnel' },
      { id: 'ipip', name: 'IPIP Tunnel', icon: 'fas fa-tunnel' },
      { id: 'sit', name: 'SIT Tunnel', icon: 'fas fa-tunnel' },
      { id: '6to4', name: '6to4 Tunnel', icon: 'fas fa-tunnel' },
      { id: 'lte', name: 'LTE', icon: 'fas fa-signal' },
      { id: 'wds', name: 'WDS', icon: 'fas fa-wifi' },
      { id: 'mesh', name: 'Mesh', icon: 'fas fa-project-diagram' },
      { id: 'cap', name: 'CAPsMAN', icon: 'fas fa-wifi' },
      { id: 'dynamic', name: 'Dynamic', icon: 'fas fa-random' }
    ]},
    { id: 'ip', name: 'IP', icon: 'fas fa-globe', children: [
      { id: 'addresses', name: 'Addresses', icon: 'fas fa-map-marker-alt' },
      { id: 'routes', name: 'Routes', icon: 'fas fa-route' },
      { id: 'dhcp-server', name: 'DHCP Server', icon: 'fas fa-server' },
      { id: 'dhcp-server-leases', name: 'DHCP Server Leases', icon: 'fas fa-list' },
      { id: 'dns', name: 'DNS', icon: 'fas fa-globe-americas' },
      { id: 'firewall', name: 'Firewall', icon: 'fas fa-shield-alt' },
      { id: 'neighbor', name: 'Neighbor Discovery', icon: 'fas fa-search' }
    ]},
    { id: 'ppp', name: 'PPP', icon: 'fas fa-user-circle', children: [
      { id: 'secrets', name: 'Secrets', icon: 'fas fa-key' },
      { id: 'profiles', name: 'Profiles', icon: 'fas fa-user-cog' },
      { id: 'active', name: 'Active', icon: 'fas fa-play-circle' }
    ]},
    { id: 'system', name: 'System', icon: 'fas fa-cog', children: [
      { id: 'resources', name: 'Resources', icon: 'fas fa-microchip' },
      { id: 'logs', name: 'Logs', icon: 'fas fa-file-alt' },
      { id: 'identity', name: 'Identity', icon: 'fas fa-id-card' }
    ]},
    { id: 'tools', name: 'Tools', icon: 'fas fa-tools', children: [
      { id: 'ping', name: 'Ping', icon: 'fas fa-broadcast-tower' },
      { id: 'traceroute', name: 'Traceroute', icon: 'fas fa-route' },
      { id: 'netwatch', name: 'Netwatch', icon: 'fas fa-eye' }
    ]}
  ];

  ngOnInit(): void {
    // Forms are already initialized in constructor
    this.managementData = null;
    this.lastUpdate = null;
    this.error = null;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue && !changes['isOpen'].previousValue) {
      this.managementData = null;
      this.lastUpdate = null;
      this.error = null;
      this.openMenus.clear();
      this.activeSection = 'interfaces';
      this.stopAutoRefresh();
    }
    
    if (changes['nasDevice'] && changes['nasDevice'].currentValue !== changes['nasDevice'].previousValue) {
      this.managementData = null;
      this.lastUpdate = null;
      this.error = null;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopAutoRefresh();
  }

  loadManagementData(): void {
    if (!this.nasDevice) {
      return;
    }

    this.loading = true;
    this.error = null;

    const username = this.useCustomCredentials ? this.customUsername : undefined;
    const password = this.useCustomCredentials ? this.customPassword : undefined;

    this.loadSectionData(this.activeSection, username, password);
  }

  loadSectionData(section: string, username?: string, password?: string): void {
    if (!this.nasDevice || !this.nasDevice.id) {
      this.error = 'NAS device ID is missing';
      this.loading = false;
      return;
    }
    
    this.loading = true;
    this.error = null;
    
    const user = username || this.username;
    const pass = password || this.password;
    
    let apiCall;
    
    switch (section) {
      case 'addresses':
        apiCall = this.nasService.getIpAddresses(this.nasDevice.id);
        break;
      case 'routes':
        apiCall = this.nasService.getRoutes(this.nasDevice.id);
        break;
      case 'firewall':
        // Load both firewall and NAT rules for the firewall section
        this.loadFirewallData(user, pass);
        return;
      case 'dhcp-server':
        apiCall = this.nasService.getDhcpServer(this.nasDevice.id);
        break;
      case 'dhcp-server-leases':
        apiCall = this.nasService.getDhcpServerLeases(this.nasDevice.id);
        break;
      case 'dhcp-client':
        apiCall = this.nasService.getDhcpClient(this.nasDevice.id);
        break;
      case 'dns':
        // Load both DNS settings and static records
        this.nasService.getDns(this.nasDevice.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (dnsResponse: any) => {
              // ManagementData yoksa initialize et
              if (!this.managementData) {
                this.managementData = {
                  interfaces: [],
                  ipAddresses: [],
                  pppoeSecrets: [],
                  systemInfo: {},
                  logs: [],
                  routes: [],
                  firewallRules: [],
                  natRules: [],
                  pppProfiles: [],
                  activePppSessions: [],
                  dhcpServerLeases: [],
                  dhcpClientLeases: [],
                  dnsRecords: [],
                  dnsSettings: null,
                  dnsStaticRecords: [],
                  arpEntries: [],
                  neighborEntries: [],
                  systemLogs: [],
                  identity: {},
                  pingResults: [],
                  tracerouteResults: [],
                  netwatchResults: []
                };
              }
              
              if (dnsResponse.success && this.managementData) {
                this.managementData.dnsSettings = dnsResponse.data?.dns_settings || null;
                // DNS settings yüklendikten sonra loading state'i false yap
                this.loading = false;
              }
            },
            error: (error) => {
              console.error('DNS settings error:', error);
              this.loading = false;
            }
          });
        
        apiCall = this.nasService.getDnsStatic(this.nasDevice.id);
        break;
      case 'neighbor':
        apiCall = this.nasService.getNeighborEntries(this.nasDevice.id);
        break;
      // PPP sections
      case 'secrets':
        apiCall = this.nasService.getPppoeSecrets(this.nasDevice.id);
        break;
      case 'profiles':
        apiCall = this.nasService.getPppProfiles(this.nasDevice.id);
        break;
      case 'active':
        apiCall = this.nasService.getActivePppSessions(this.nasDevice.id);
        break;
      // Interface types - all use getMikrotikInfo
      case 'interfaces':
      case 'ethernet':
      case 'wireless':
      case 'bridge':
      case 'vlan':
      case 'bond':
      case 'pppoe-out':
      case 'pppoe-in':
      case 'vpn':
      case 'tunnel':
      case 'vrrp':
      case 'loopback':
      case 'ovpn-out':
      case 'ovpn-in':
      case 'sstp-out':
      case 'sstp-in':
      case 'l2tp-out':
      case 'l2tp-in':
      case 'pptp-out':
      case 'pptp-in':
      case 'gre':
      case 'eoip':
      case 'ipip':
      case 'sit':
      case '6to4':
      case 'lte':
      case 'wds':
      case 'mesh':
      case 'cap':
      case 'dynamic':
        apiCall = this.nasService.getMikrotikInfo(this.nasDevice.id);
        break;
      default:
        apiCall = this.nasService.getMikrotikInfo(this.nasDevice.id);
        break;
    }
    
    apiCall.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            if (!this.managementData) {
              this.managementData = {
                interfaces: [],
                ipAddresses: [],
                pppoeSecrets: [],
                systemInfo: {},
                logs: [],
                routes: [],
                firewallRules: [],
                natRules: [],
                pppProfiles: [],
                activePppSessions: [],
                systemLogs: [],
                identity: {},
                pingResults: [],
                tracerouteResults: [],
                netwatchResults: [],
                dhcpServerLeases: [],
                dhcpClientLeases: [],
                dnsRecords: [],
                dnsSettings: null,
                dnsStaticRecords: [],
                arpEntries: [],
                neighborEntries: [],
              };
            }
            
            switch (section) {
              case 'interfaces':
              case 'ethernet':
              case 'wireless':
              case 'bridge':
              case 'vlan':
              case 'bond':
              case 'pppoe-out':
              case 'pppoe-in':
              case 'vpn':
              case 'tunnel':
              case 'vrrp':
              case 'loopback':
              case 'ovpn-out':
              case 'ovpn-in':
              case 'sstp-out':
              case 'sstp-in':
              case 'l2tp-out':
              case 'l2tp-in':
              case 'pptp-out':
              case 'pptp-in':
              case 'gre':
              case 'eoip':
              case 'ipip':
              case 'sit':
              case '6to4':
              case 'lte':
              case 'wds':
              case 'mesh':
              case 'cap':
              case 'dynamic':
                this.managementData!.interfaces = response.data.interfaces?.interfaces || [];
                break;
              case 'addresses':
                this.managementData!.ipAddresses = response.data?.addresses || [];
                break;
              case 'routes':
                this.managementData!.routes = response.data?.routes || [];
                break;
              case 'firewall':
                this.managementData!.firewallRules = response.data?.rules || [];
                break;
              case 'dhcp-server':
                this.managementData!.dhcpServerLeases = response.data?.dhcp_servers || [];
                break;
              case 'dhcp-server-leases':
                this.managementData!.dhcpServerLeases = response.data?.dhcp_server_leases || [];
                break;
              case 'dhcp-client':
                this.managementData!.dhcpClientLeases = response.data?.dhcp_clients || [];
                break;
              case 'dns':
                if (this.managementData) {
                  this.managementData.dnsStaticRecords = response.data?.dns_static || [];
                }
                break;
              case 'neighbor':
                this.managementData!.neighborEntries = response.data?.neighbor_entries || [];
                break;
              case 'secrets':
                this.managementData!.pppoeSecrets = response.data?.secrets || [];
                break;
              case 'profiles':
                this.managementData!.pppProfiles = response.data.pppProfiles || [];
                break;
              case 'active':
                this.managementData!.activePppSessions = response.data.activePppSessions || [];
                break;
              case 'resources':
              case 'logs':
              case 'identity':
                this.managementData!.systemInfo = response.data.system || {};
                this.managementData!.systemLogs = response.data.systemLogs || [];
                this.managementData!.identity = response.data.identity || {};
                break;
              case 'ping':
                this.managementData!.pingResults = response.data.pingResults || [];
                break;
              case 'traceroute':
                this.managementData!.tracerouteResults = response.data.tracerouteResults || [];
                break;
              case 'netwatch':
                this.managementData!.netwatchResults = response.data.netwatchResults || [];
                break;
            }
            
            this.lastUpdate = new Date();
            this.error = null;
          } else {
            this.error = response.message || 'Failed to load management data';
          }
          this.loading = false;
        },
        error: (err: any) => {
          this.error = 'Failed to load management data. Please try again.';
          this.loading = false;
        }
      });
  }

      selectSection(sectionId: string, event?: Event): void {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }

        this.activeSection = sectionId;
        this.loadSectionData(sectionId);
      }

  toggleMenu(menuId: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (this.openMenus.has(menuId)) {
      this.openMenus.delete(menuId);
    } else {
      this.openMenus.add(menuId);
    }
  }

  isMenuOpen(menuId: string): boolean {
    return this.openMenus.has(menuId);
  }

  getEthernetInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'ether'
    ) || [];
  }

  getWirelessInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'wlan'
    ) || [];
  }

  getBridgeInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'bridge'
    ) || [];
  }

  getVlanInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'vlan'
    ) || [];
  }

  getBondInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'bond'
    ) || [];
  }

  getPppoeOutInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'pppoe-out'
    ) || [];
  }

  getPppoeInInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'pppoe-in'
    ) || [];
  }

  getVpnInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase().includes('vpn') || 
      iface.type?.toLowerCase().includes('ovpn') ||
      iface.type?.toLowerCase().includes('sstp') ||
      iface.type?.toLowerCase().includes('l2tp') ||
      iface.type?.toLowerCase().includes('pptp')
    ) || [];
  }

  getTunnelInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase().includes('tunnel') ||
      iface.type?.toLowerCase() === 'gre' ||
      iface.type?.toLowerCase() === 'eoip' ||
      iface.type?.toLowerCase() === 'ipip' ||
      iface.type?.toLowerCase() === 'sit' ||
      iface.type?.toLowerCase() === '6to4'
    ) || [];
  }

  getVrrpInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'vrrp'
    ) || [];
  }

  getLoopbackInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'loopback'
    ) || [];
  }

  getOvpnOutInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'ovpn-out'
    ) || [];
  }

  getOvpnInInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'ovpn-in'
    ) || [];
  }

  getSstpOutInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'sstp-out'
    ) || [];
  }

  getSstpInInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'sstp-in'
    ) || [];
  }

  getL2tpOutInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'l2tp-out'
    ) || [];
  }

  getL2tpInInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'l2tp-in'
    ) || [];
  }

  getPptpOutInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'pptp-out'
    ) || [];
  }

  getPptpInInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'pptp-in'
    ) || [];
  }

  getGreInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'gre'
    ) || [];
  }

  getEoipInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'eoip'
    ) || [];
  }

  getIpipInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'ipip'
    ) || [];
  }

  getSitInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'sit'
    ) || [];
  }

  get6to4Interfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === '6to4'
    ) || [];
  }

  getLteInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'lte'
    ) || [];
  }

  getWdsInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'wds'
    ) || [];
  }

  getMeshInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'mesh'
    ) || [];
  }

  getCapInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.type?.toLowerCase() === 'cap' ||
      iface.type?.toLowerCase() === 'capsman'
    ) || [];
  }

  getDynamicInterfaces(): any[] {
    return this.managementData?.interfaces?.filter(iface => 
      iface.dynamic === 'true' || iface.type?.toLowerCase() === 'dynamic'
    ) || [];
  }

  getIpAddresses(): any[] {
    return this.managementData?.ipAddresses || [];
  }

  getRoutes(): any[] {
    return this.managementData?.routes || [];
  }

  getDhcpServerLeases(): any[] {
    return this.managementData?.dhcpServerLeases || [];
  }

  getDhcpClientLeases(): any[] {
    return this.managementData?.dhcpClientLeases || [];
  }

  getDnsRecords(): any[] {
    return this.managementData?.dnsRecords || [];
  }

  getDnsSettings(): any {
    return this.managementData?.dnsSettings || null;
  }

  getFirewallRules(): any[] {
    return this.managementData?.firewallRules || [];
  }

  getFirewallFilterRules(): any[] {
    // Filter rules are the main firewall rules (not NAT)
    return this.managementData?.firewallRules || [];
  }

  getFirewallMangleRules(): any[] {
    // Mangle rules - for now return empty array as they're not in the current API response
    // In real Mikrotik, these would be separate rules with 'mark' actions
    return [];
  }

  getFirewallRawRules(): any[] {
    // Raw rules - for now return empty array as they're not in the current API response
    // In real Mikrotik, these would be rules in the 'raw' table
    return [];
  }

  getNatRules(): any[] {
    return this.managementData?.natRules || [];
  }


  getNeighborEntries(): any[] {
    return this.managementData?.neighborEntries || [];
  }

  // PPPoE Secrets CRUD methods
  initializePppoeSecretForm(): void {
    this.pppoeSecretForm = this.fb.group({
      name: ['', Validators.required],
      password: ['', Validators.required],
      service: ['any'],
      profile: [''],
      localAddress: [''],
      remoteAddress: [''],
      routes: [''],
      comment: [''],
      disabled: [false]
    });
  }

  startAddPppoeSecret(): void {
    this.isEditingPppoeSecret = false;
    this.currentPppoeSecret = null;
    this.pppoeSecretForm.reset({
      service: 'any',
      disabled: false
    });
    this.loadPppProfiles();
    this.showPppoeSecretModal = true;
  }

  startEditPppoeSecret(secret: any): void {
    this.isEditingPppoeSecret = true;
    this.currentPppoeSecret = secret;
    this.pppoeSecretForm.patchValue({
      name: secret.name || '',
      password: secret.password || '',
      service: secret.service || 'any',
      profile: secret.profile || '',
      localAddress: secret.localAddress || '',
      remoteAddress: secret.remoteAddress || '',
      routes: secret.routes || '',
      comment: secret.comment || '',
      disabled: secret.disabled || false
    });
    this.loadPppProfiles();
    this.showPppoeSecretModal = true;
  }

  loadPppProfiles(): void {
    if (this.nasId) {
      this.nasService.getPppProfiles(this.nasId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.pppProfiles = response.data?.pppProfiles || [];
            } else {
              this.pppProfiles = [];
            }
          },
          error: (error) => {
            console.error('Error loading PPP profiles:', error);
            this.pppProfiles = [];
          }
        });
    }
  }

  cancelPppoeSecretEdit(): void {
    this.showPppoeSecretModal = false;
    this.isEditingPppoeSecret = false;
    this.currentPppoeSecret = null;
    this.pppoeSecretForm.reset();
  }

  savePppoeSecret(): void {
    if (this.pppoeSecretForm.valid && this.nasId) {
      this.isPppoeSecretLoading = true;
      const formData = this.pppoeSecretForm.value;

      const apiCall = this.isEditingPppoeSecret 
        ? this.nasService.updatePppoeSecret(this.nasId, this.currentPppoeSecret.id, formData)
        : this.nasService.createPppoeSecret(this.nasId, formData);

      apiCall.pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          if (response.success) {
            this.cancelPppoeSecretEdit();
            this.loadSectionData('secrets');
            // Show success message
            alert('PPPoE Secret saved successfully!');
          } else {
            alert('Error: ' + response.message);
          }
          this.isPppoeSecretLoading = false;
        },
        error: (error) => {
          console.error('Error saving PPPoE secret:', error);
          alert('Error saving PPPoE secret');
          this.isPppoeSecretLoading = false;
        }
      });
    }
  }

  deletePppoeSecret(secret: any): void {
    if (confirm('Are you sure you want to delete this PPPoE secret?')) {
      if (this.nasId) {
        this.nasService.deletePppoeSecret(this.nasId, secret.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              if (response.success) {
                this.loadSectionData('secrets');
                alert('PPPoE Secret deleted successfully!');
              } else {
                alert('Error: ' + response.message);
              }
            },
            error: (error) => {
              console.error('Error deleting PPPoE secret:', error);
              alert('Error deleting PPPoE secret');
            }
          });
      }
    }
  }

  togglePppoeSecret(secret: any): void {
    if (this.nasId) {
      const newDisabledState = secret.disabled === 'false';
      this.nasService.togglePppoeSecret(this.nasId, secret.id, newDisabledState)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.loadSectionData('secrets');
            } else {
              alert('Error: ' + response.message);
            }
          },
          error: (error) => {
            console.error('Error toggling PPPoE secret:', error);
            alert('Error toggling PPPoE secret');
          }
        });
    }
  }


  openInterfaceDetail(interfaceData: any): void {
    this.selectedInterface = interfaceData;
    this.showInterfaceDetail = true;
    
    if (interfaceData.name) {
      this.loadInterfaceDetails(interfaceData.name);
    }
  }

  loadInterfaceDetails(interfaceName: string): void {
    if (!this.nasDevice || !this.nasDevice.id) {
      return;
    }

    this.isInterfaceLoading = true;
    
    this.nasService.getInterfaceDetails(this.nasDevice.id, interfaceName)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.isInterfaceLoading = false;
          if (response.success && this.selectedInterface) {
            this.selectedInterface = {
              ...this.selectedInterface,
              ...response.data
            };
          }
        },
        error: (error: any) => {
          this.isInterfaceLoading = false;
          console.error('Failed to load interface details:', error);
        }
      });
  }

  closeInterfaceDetail(): void {
    this.showInterfaceDetail = false;
    this.selectedInterface = null;
  }

  saveInterfaceChanges(editedInterface: any): void {
    if (!this.nasDevice?.id) {
      return;
    }

    const user = this.useCustomCredentials ? this.customUsername : this.username;
    const pass = this.useCustomCredentials ? this.customPassword : this.password;

    alert('Interface update functionality is not available yet');
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  startAutoRefresh(): void {
    this.refreshTimer = setInterval(() => {
      this.loadSectionData(this.activeSection);
    }, this.refreshInterval);
  }

  stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  onClose(): void {
    this.close.emit();
  }

  getSectionTitle(sectionId: string): string {
    const sectionTitles: { [key: string]: string } = {
      'interfaces': 'Interfaces',
      'ethernet': 'Ethernet Interfaces',
      'wireless': 'Wireless Interfaces',
      'bridge': 'Bridge Interfaces',
      'vlan': 'VLAN Interfaces',
      'bond': 'Bonding Interfaces',
      'pppoe-out': 'PPPoE Client Interfaces',
      'pppoe-in': 'PPPoE Server Interfaces',
      'vpn': 'VPN Interfaces',
      'tunnel': 'Tunnel Interfaces',
      'vrrp': 'VRRP Interfaces',
      'loopback': 'Loopback Interfaces',
      'ovpn-out': 'OpenVPN Client Interfaces',
      'ovpn-in': 'OpenVPN Server Interfaces',
      'sstp-out': 'SSTP Client Interfaces',
      'sstp-in': 'SSTP Server Interfaces',
      'l2tp-out': 'L2TP Client Interfaces',
      'l2tp-in': 'L2TP Server Interfaces',
      'pptp-out': 'PPTP Client Interfaces',
      'pptp-in': 'PPTP Server Interfaces',
      'gre': 'GRE Tunnel Interfaces',
      'eoip': 'EoIP Tunnel Interfaces',
      'ipip': 'IPIP Tunnel Interfaces',
      'sit': 'SIT Tunnel Interfaces',
      '6to4': '6to4 Tunnel Interfaces',
      'lte': 'LTE Interfaces',
      'wds': 'WDS Interfaces',
      'mesh': 'Mesh Interfaces',
      'cap': 'CAPsMAN Interfaces',
      'dynamic': 'Dynamic Interfaces',
      'addresses': 'IP Addresses',
      'routes': 'Routes',
      'dhcp-server': 'DHCP Server',
      'dhcp-client': 'DHCP Client',
      'dns': 'DNS',
      'firewall': 'Firewall',
      'firewall-filter': 'Firewall Filter Rules',
      'firewall-mangle': 'Firewall Mangle Rules',
      'firewall-raw': 'Firewall Raw Rules',
      'nat': 'NAT Rules',
      'arp': 'ARP Table',
      'neighbor': 'Neighbor Discovery',
      'secrets': 'PPP Secrets',
      'profiles': 'PPP Profiles',
      'active': 'Active PPP Sessions',
      'resources': 'System Resources',
      'logs': 'System Logs',
      'identity': 'System Identity',
      'ping': 'Ping Tool',
      'traceroute': 'Traceroute Tool',
      'netwatch': 'Netwatch'
    };
    
    return sectionTitles[sectionId] || sectionId;
  }

  getInterfacesByType(type: string): any[] {
    switch (type) {
      case 'ethernet': return this.getEthernetInterfaces();
      case 'wireless': return this.getWirelessInterfaces();
      case 'bridge': return this.getBridgeInterfaces();
      default: return [];
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatUptime(uptime: string): string {
    return uptime || 'N/A';
  }

  getMemoryUsagePercentage(): number {
    if (!this.managementData?.systemInfo) return 0;
    const total = this.managementData.systemInfo['total-memory'];
    const free = this.managementData.systemInfo['free-memory'];
    if (!total || !free) return 0;
    return Math.round(((total - free) / total) * 100);
  }

  getDiskUsagePercentage(): number {
    if (!this.managementData?.systemInfo) return 0;
    const total = this.managementData.systemInfo['total-hdd-space'];
    const free = this.managementData.systemInfo['free-hdd-space'];
    if (!total || !free) return 0;
    return Math.round(((total - free) / total) * 100);
  }

  executePing(): void {
    alert('Ping functionality not implemented yet');
  }

  executeTraceroute(): void {
    alert('Traceroute functionality not implemented yet');
  }

  initializeAddressForm(): void {
    this.addressForm = this.fb.group({
      address: ['', [Validators.required]],
      interface: ['', [Validators.required]],
      comment: [''],
      disabled: [false]
    });
  }

  initializeRouteForm(): void {
    this.routeForm = this.fb.group({
      dstAddress: ['', [Validators.required]],
      gateway: [''],
      distance: [1],
      comment: [''],
      disabled: [false]
    });
  }

  openAddAddressModal(): void {
    this.showAddressModal = true;
    this.isEditingAddress = false;
    this.currentAddress = null;
    
    // Ensure form is initialized before using it
    if (this.addressForm) {
      this.addressForm.reset({
        address: '',
        interface: '',
        comment: '',
        disabled: false
      });
    }
    
    this.loadAvailableInterfaces();
  }

  // Helper method to check if an address is protected (dynamic or VPN interface)
  isProtectedAddress(address: any): boolean {
    // Check if address has dynamic flag (D) - check both dynamic field and flags
    if (address.dynamic === 'true' || address.dynamic === true) {
      return true;
    }
    
    // Check flags field for D (DYNAMIC) flag
    if (address.flags && typeof address.flags === 'string' && address.flags.includes('D')) {
      return true;
    }
    
    // Check if interface is a VPN type (PPPoE, SSTP, L2TP, PPTP)
    const interfaceName = address.interface?.toLowerCase() || '';
    const vpnPrefixes = ['<pppoe-', '<sstp-', '<l2tp-', '<pptp-'];
    
    return vpnPrefixes.some(prefix => interfaceName.startsWith(prefix));
  }

  // Helper method to check if a route is protected (non-static routes)
  isProtectedRoute(route: any): boolean {
    // Check if route is static (As flag in Mikrotik) - static routes are NOT protected
    if (route.static === 'true' || route.static === true) {
      return false; // Static routes can be edited
    }
    
    // Check flags field for 's' (STATIC) flag - static routes are NOT protected
    if (route.flags && typeof route.flags === 'string' && route.flags.includes('s')) {
      return false; // Static routes can be edited
    }
    
    // Check if it's a system route (distance 0) - these are protected
    if (route.distance === 0 || route.distance === '0') {
      return true; // System routes are protected
    }
    
    // All other routes (dynamic, etc.) are protected
    return true;
  }

  editAddress(address: any): void {
    // Prevent editing protected addresses (dynamic or VPN interfaces)
    if (this.isProtectedAddress(address)) {
      const reason = (address.dynamic === 'true' || address.dynamic === true || address.flags?.includes('D'))
        ? 'dinamik adres' 
        : 'VPN interface';
      alert(`Bu IP adresi düzenlenemez çünkü ${reason} türündedir.\nAdres: ${address.address}\nInterface: ${address.interface}`);
      console.warn(`Cannot edit protected address: ${address.address} (${reason})`);
      return;
    }

    this.showAddressModal = true;
    this.isEditingAddress = true;
    this.currentAddress = address;
    
    // Ensure form is initialized before using it
    if (this.addressForm) {
      this.addressForm.patchValue({
        address: address.address,
        interface: address.interface,
        comment: address.comment || '',
        disabled: address.disabled === 'true'
      });
    }
    
    this.loadAvailableInterfaces();
  }

  deleteAddress(address: any): void {
    // Prevent deleting protected addresses (dynamic or VPN interfaces)
    if (this.isProtectedAddress(address)) {
      const reason = (address.dynamic === 'true' || address.dynamic === true || address.flags?.includes('D'))
        ? 'dinamik adres' 
        : 'VPN interface';
      alert(`Bu IP adresi silinemez çünkü ${reason} türündedir.\nAdres: ${address.address}\nInterface: ${address.interface}`);
      console.warn(`Cannot delete protected address: ${address.address} (${reason})`);
      return;
    }

    if (confirm(`Bu IP adresini silmek istediğinizden emin misiniz?\nAdres: ${address.address}\nInterface: ${address.interface}`)) {
      this.isAddressLoading = true;
      
      if (!this.nasId) {
        console.error('NAS ID bulunamadı');
        this.isAddressLoading = false;
        return;
      }

      this.nasService.deleteIpAddress(this.nasId, address.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isAddressLoading = false;
            if (response.success) {
              alert('IP address deleted successfully');
              this.loadSectionData('addresses');
            } else {
              alert('Failed to delete IP address: ' + (response.message || 'Unknown error'));
            }
          },
          error: (error) => {
            this.isAddressLoading = false;
            console.error('Delete IP address error:', error);
            alert('Failed to delete IP address: ' + (error.error?.message || error.message || 'Network error'));
          }
        });
    }
  }

  saveAddress(): void {
    if (!this.addressForm) {
      console.error('Address form is not initialized');
      return;
    }
    
    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    if (!this.nasId) {
      alert('Invalid device information');
      return;
    }

    this.isAddressLoading = true;
    const formValue = this.addressForm.value;
    
    const addressData = {
      address: formValue.address,
      interface: formValue.interface,
      comment: formValue.comment || '',
      disabled: formValue.disabled || false
    };

    const request = this.isEditingAddress && this.currentAddress?.id
      ? this.nasService.updateIpAddress(this.nasId, this.currentAddress.id, addressData)
      : this.nasService.addIpAddress(this.nasId, addressData);

    request.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isAddressLoading = false;
          if (response.success) {
            alert(`IP address ${this.isEditingAddress ? 'updated' : 'added'} successfully`);
            this.closeAddressModal();
            this.loadSectionData('addresses');
          } else {
            alert(`Failed to ${this.isEditingAddress ? 'update' : 'add'} IP address: ` + (response.message || 'Unknown error'));
          }
        },
        error: (error) => {
          this.isAddressLoading = false;
          console.error(`${this.isEditingAddress ? 'Update' : 'Add'} IP address error:`, error);
          alert(`Failed to ${this.isEditingAddress ? 'update' : 'add'} IP address: ` + (error.error?.message || error.message || 'Network error'));
        }
      });
  }

  closeAddressModal(): void {
    this.showAddressModal = false;
    this.isEditingAddress = false;
    this.currentAddress = null;
    this.isAddressLoading = false;
    
    // Reset form if it exists
    if (this.addressForm) {
      this.addressForm.reset();
    }
    
    this.availableInterfaces = [];
  }

  loadAvailableInterfaces(): void {
    if (!this.nasDevice?.id) {
      return;
    }

    this.nasService.getMikrotikInfo(this.nasDevice.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success && response.data?.interfaces?.interfaces) {
            this.availableInterfaces = response.data.interfaces.interfaces.map((iface: any) => ({
              name: iface.name,
              type: iface.type,
              disabled: iface.disabled === 'true'
            }));
          }
        },
        error: (error: any) => {
          console.error('Failed to load interfaces:', error);
        }
      });
  }

  addRoute(): void {
    this.openAddRouteModal();
  }

  editRoute(route: any, index: number): void {
    // Prevent editing protected routes (non-static routes)
    if (this.isProtectedRoute(route)) {
      const reason = (route.distance === 0 || route.distance === '0')
        ? 'sistem route' 
        : 'dinamik route';
      alert(`Bu route düzenlenemez çünkü ${reason} türündedir.\nHedef: ${route.dstAddress}\nGateway: ${route.gateway}`);
      console.warn(`Cannot edit protected route: ${route.dstAddress} (${reason})`);
      return;
    }

    this.showRouteModal = true;
    this.isEditingRoute = true;
    this.currentRoute = { ...route, index };
    this.routeForm.patchValue({
      dstAddress: route.dstAddress || route['dst-address'] || '',
      gateway: route.gateway || '',
      distance: route.distance || 1,
      comment: route.comment || '',
      disabled: route.disabled === 'true'
    });
  }

  deleteRoute(route: any, index: number): void {
    // Prevent deleting protected routes (non-static routes)
    if (this.isProtectedRoute(route)) {
      const reason = (route.distance === 0 || route.distance === '0')
        ? 'sistem route' 
        : 'dinamik route';
      alert(`Bu route silinemez çünkü ${reason} türündedir.\nHedef: ${route.dstAddress}\nGateway: ${route.gateway}`);
      console.warn(`Cannot delete protected route: ${route.dstAddress} (${reason})`);
      return;
    }

    if (confirm(`Bu route'u silmek istediğinizden emin misiniz?\nHedef: ${route.dstAddress || route['dst-address']}\nGateway: ${route.gateway}`)) {
      this.isRouteLoading = true;
      
      if (!this.nasId) {
        console.error('NAS ID bulunamadı');
        this.isRouteLoading = false;
        return;
      }

      this.nasService.deleteRoute(this.nasId, route.id || index, this.username, this.password)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isRouteLoading = false;
            if (response.success) {
              alert('Route deleted successfully');
              this.loadSectionData('routes');
            } else {
              alert('Failed to delete route: ' + (response.message || 'Unknown error'));
            }
          },
          error: (error) => {
            this.isRouteLoading = false;
            console.error('Delete route error:', error);
            alert('Failed to delete route: ' + (error.error?.message || error.message || 'Network error'));
          }
        });
    }
  }

  openAddRouteModal(): void {
    this.showRouteModal = true;
    this.isEditingRoute = false;
    this.currentRoute = null;
    this.routeForm.reset({
      dstAddress: '',
      gateway: '',
      distance: 1,
      comment: '',
      disabled: false
    });
  }

  saveRoute(): void {
    if (this.routeForm.invalid) {
      this.routeForm.markAllAsTouched();
      return;
    }

    if (!this.nasId) {
      alert('Invalid device information');
      return;
    }

    this.isRouteLoading = true;
    const formValue = this.routeForm.value;
    
    const routeData = {
      dstAddress: formValue.dstAddress,
      gateway: formValue.gateway,
      distance: formValue.distance || 1,
      comment: formValue.comment || '',
      disabled: formValue.disabled || false
    };

    const request = this.isEditingRoute && this.currentRoute?.id
      ? this.nasService.updateRoute(this.nasId, this.currentRoute.id, routeData, this.username, this.password)
      : this.nasService.addRoute(this.nasId, routeData, this.username, this.password);

    request.pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isRouteLoading = false;
          if (response.success) {
            alert(`Route ${this.isEditingRoute ? 'updated' : 'added'} successfully`);
            this.closeRouteModal();
            this.loadSectionData('routes');
          } else {
            alert(`Failed to ${this.isEditingRoute ? 'update' : 'add'} route: ` + (response.message || 'Unknown error'));
          }
        },
        error: (error) => {
          this.isRouteLoading = false;
          console.error(`${this.isEditingRoute ? 'Update' : 'Add'} route error:`, error);
          alert(`Failed to ${this.isEditingRoute ? 'update' : 'add'} route: ` + (error.error?.message || error.message || 'Network error'));
        }
      });
  }

  closeRouteModal(): void {
    this.showRouteModal = false;
    this.isEditingRoute = false;
    this.currentRoute = null;
    this.routeForm.reset();
  }

  // DHCP Server Methods
  addDhcpServer(): void {
    // TODO: Implement add DHCP server modal
    alert('Add DHCP Server functionality will be implemented');
  }

  editDhcpServer(server: any): void {
    // TODO: Implement edit DHCP server modal
    alert(`Edit DHCP Server: ${server.name}`);
  }

  deleteDhcpServer(server: any): void {
    if (confirm(`Bu DHCP server'ı silmek istediğinizden emin misiniz?\nName: ${server.name}\nInterface: ${server.interface}`)) {
      // TODO: Implement delete DHCP server
      alert(`Delete DHCP Server: ${server.name}`);
    }
  }

  // Firewall Management Methods
  loadFirewallData(user: string, pass: string): void {
    // Initialize managementData if not exists
    if (!this.managementData) {
      this.managementData = {
        interfaces: [],
        ipAddresses: [],
        pppoeSecrets: [],
        systemInfo: {},
        logs: [],
        routes: [],
        firewallRules: [],
        natRules: [],
        pppProfiles: [],
        activePppSessions: [],
        systemLogs: [],
        identity: {},
        pingResults: [],
        tracerouteResults: [],
        netwatchResults: [],
        dhcpServerLeases: [],
        dhcpClientLeases: [],
        dnsRecords: [],
        dnsSettings: null,
        dnsStaticRecords: [],
        arpEntries: [],
        neighborEntries: [],
      };
    }
    
    // Load only filter rules initially (first tab)
    this.loadFilterRules(user, pass);
  }

  loadFilterRules(user: string, pass: string): void {
    if (this.firewallLoading.filter) return; // Already loading
    
    this.firewallLoading.filter = true;
    this.nasService.getFirewallRules(this.nasDevice.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.firewallLoading.filter = false;
          this.loading = false; // Reset main loading state
          if (response.success) {
            this.managementData!.firewallRules = response.data?.rules || [];
          }
        },
        error: (error) => {
          this.firewallLoading.filter = false;
          this.loading = false; // Reset main loading state
          console.error('Error loading filter rules:', error);
          this.error = 'Failed to load filter rules';
        }
      });
  }

  loadNatRules(user: string, pass: string): void {
    if (this.firewallLoading.nat) return; // Already loading
    if (this.managementData?.natRules && this.managementData.natRules.length > 0) return; // Already loaded
    
    this.firewallLoading.nat = true;
    this.nasService.getNatRules(this.nasDevice.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          this.firewallLoading.nat = false;
          if (response.success) {
            this.managementData!.natRules = response.data?.rules || [];
          }
        },
        error: (error) => {
          this.firewallLoading.nat = false;
          console.error('Error loading NAT rules:', error);
          this.error = 'Failed to load NAT rules';
        }
      });
  }

  loadMangleRules(user: string, pass: string): void {
    // For now, mangle rules are empty as they're not in the API
    // This method is here for future implementation
    this.firewallLoading.mangle = false;
  }

  loadRawRules(user: string, pass: string): void {
    // For now, raw rules are empty as they're not in the API
    // This method is here for future implementation
    this.firewallLoading.raw = false;
  }

  loadConnections(user: string, pass: string): void {
    // For now, connections are empty as they're not implemented
    // This method is here for future implementation
    this.firewallLoading.connections = false;
  }

  setActiveFirewallTab(tab: string): void {
    this.activeFirewallTab = tab;
    
    // Load data for the selected tab if not already loaded
    const user = this.useCustomCredentials ? this.customUsername : this.username;
    const pass = this.useCustomCredentials ? this.customPassword : this.password;
    
    if (!user || !pass) return;
    
    switch (tab) {
      case 'filter':
        // Filter rules are loaded initially
        break;
      case 'nat':
        this.loadNatRules(user, pass);
        break;
      case 'mangle':
        this.loadMangleRules(user, pass);
        break;
      case 'raw':
        this.loadRawRules(user, pass);
        break;
      case 'connections':
        this.loadConnections(user, pass);
        break;
    }
  }

  isActiveFirewallTab(tab: string): boolean {
    return this.activeFirewallTab === tab;
  }

  refreshFirewallData(): void {
    if (this.nasDevice?.id) {
      this.loadSectionData('firewall');
    }
  }

  addFirewallRule(): void {
    // TODO: Implement add firewall rule modal
    alert('Add Firewall Rule functionality will be implemented');
  }

  editFirewallRule(rule: any): void {
    // TODO: Implement edit firewall rule modal
    alert(`Edit Firewall Rule: ${rule.comment || rule.id}`);
  }

  toggleFirewallRule(rule: any): void {
    const isDisabled = rule.disabled === 'true';
    const action = isDisabled ? 'Enable' : 'Disable';
    if (confirm(`${action} this firewall rule?`)) {
      // TODO: Implement toggle firewall rule
      alert(`${action} Firewall Rule: ${rule.comment || rule.id}`);
    }
  }

  deleteFirewallRule(rule: any): void {
    if (confirm(`Delete this firewall rule?\nComment: ${rule.comment || 'N/A'}\nChain: ${rule.chain || 'N/A'}\nAction: ${rule.action || 'N/A'}`)) {
      // TODO: Implement delete firewall rule
      alert(`Delete Firewall Rule: ${rule.comment || rule.id}`);
    }
  }

  getActiveConnections(): any[] {
    // TODO: Implement get active connections
    return [];
  }

  refreshConnections(): void {
    // TODO: Implement refresh connections
    alert('Refresh connections functionality will be implemented');
  }

  closeConnection(connection: any): void {
    if (confirm(`Close this connection?\n${connection.srcAddress}:${connection.srcPort} -> ${connection.dstAddress}:${connection.dstPort}`)) {
      // TODO: Implement close connection
      alert(`Close Connection: ${connection.srcAddress}:${connection.srcPort}`);
    }
  }

  // DNS Edit Methods
  startDnsEdit(): void {
    this.editingDns = true;
    this.initDnsForm();
  }

  cancelDnsEdit(): void {
    this.editingDns = false;
    this.dnsEditForm = null as any;
  }

  private initDnsForm(): void {
    const dnsSettings = this.managementData?.dnsSettings || {};
    this.dnsEditForm = this.fb.group({
      servers: [dnsSettings.servers || '', Validators.required],
      allowRemoteRequests: [dnsSettings.allowRemoteRequests || false],
      verifyDohCert: [dnsSettings.verifyDohCert || false],
      cacheSize: [dnsSettings.cacheSize || '2048KiB'],
      queryServerTimeout: [dnsSettings.queryServerTimeout || '2s'],
      queryTotalTimeout: [dnsSettings.queryTotalTimeout || '10s'],
      maxConcurrentQueries: [dnsSettings.maxConcurrentQueries || 100],
      maxConcurrentTcpSessions: [dnsSettings.maxConcurrentTcpSessions || 20]
    });
  }

  saveDnsSettings(): void {
    if (this.dnsEditForm?.valid && this.nasDevice?.id) {
      this.dnsLoading = true;
      
      const dnsSettings = this.dnsEditForm.value;
      
      this.nasService.updateDns(this.nasDevice.id, dnsSettings)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.dnsLoading = false;
            if (response.success) {
              this.editingDns = false;
              // Refresh DNS data
              this.loadSectionData('dns');
              alert('DNS settings updated successfully!');
            } else {
              alert(`Failed to update DNS settings: ${response.message || 'Unknown error'}`);
            }
          },
          error: (error) => {
            this.dnsLoading = false;
            console.error('DNS update error:', error);
            alert(`Failed to update DNS settings: ${error.message || 'Network error'}`);
          }
        });
    } else {
      alert('Please fill in all required fields');
    }
  }

  // DNS Static Records CRUD Methods
  startAddDnsRecord(): void {
    this.addingDnsRecord = true;
    this.initDnsRecordForm();
  }

  startEditDnsRecord(record: any): void {
    this.editingDnsRecord = true;
    this.selectedDnsRecord = record;
    this.initDnsRecordForm(record);
  }

  cancelDnsRecordEdit(): void {
    this.editingDnsRecord = false;
    this.addingDnsRecord = false;
    this.selectedDnsRecord = null;
    this.dnsRecordForm = null as any;
  }

  private initDnsRecordForm(record?: any): void {
    this.dnsRecordForm = this.fb.group({
      name: [record?.name || '', Validators.required],
      address: [record?.address || '', [Validators.required, Validators.pattern(/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)]],
      ttl: [record?.ttl || '1d'],
      comment: [record?.comment || '']
    });
  }

  saveDnsRecord(): void {
    if (this.dnsRecordForm?.valid && this.nasDevice?.id) {
      this.dnsRecordLoading = true;
      
      const recordData = this.dnsRecordForm.value;
      
      let apiCall;
      if (this.addingDnsRecord) {
        apiCall = this.nasService.addDnsStaticRecord(this.nasDevice.id, recordData);
      } else {
        apiCall = this.nasService.updateDnsStaticRecord(this.nasDevice.id, this.selectedDnsRecord.id, recordData);
      }
      
      apiCall.pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.dnsRecordLoading = false;
            if (response.success) {
              this.cancelDnsRecordEdit();
              // Refresh DNS static records
              this.loadSectionData('dns');
              alert(`${this.addingDnsRecord ? 'Added' : 'Updated'} DNS static record successfully!`);
            } else {
              alert(`Failed to ${this.addingDnsRecord ? 'add' : 'update'} DNS static record: ${response.message || 'Unknown error'}`);
            }
          },
          error: (error) => {
            this.dnsRecordLoading = false;
            console.error('DNS record error:', error);
            alert(`Failed to ${this.addingDnsRecord ? 'add' : 'update'} DNS static record: ${error.message || 'Network error'}`);
          }
        });
    } else {
      alert('Please fill in all required fields correctly');
    }
  }

  deleteDnsRecord(record: any): void {
    if (confirm(`Delete DNS static record?\nName: ${record.name}\nAddress: ${record.address}`) && this.nasDevice?.id) {
      this.dnsRecordLoading = true;
      
      this.nasService.deleteDnsStaticRecord(this.nasDevice.id, record.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.dnsRecordLoading = false;
            if (response.success) {
              // Refresh DNS static records
              this.loadSectionData('dns');
              alert('DNS static record deleted successfully!');
            } else {
              alert(`Failed to delete DNS static record: ${response.message || 'Unknown error'}`);
            }
          },
          error: (error) => {
            this.dnsRecordLoading = false;
            console.error('DNS record delete error:', error);
            alert(`Failed to delete DNS static record: ${error.message || 'Network error'}`);
          }
        });
    }
  }

}
