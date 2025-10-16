import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { DashboardService, DashboardStats, UserStatus } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { TenantService, Tenant } from '../../services/tenant.service';
import { WebSocketService } from '../../services/websocket.service';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, TranslateModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  stats: DashboardStats = {
    totalUsers: 0,
    activeUsers: 0,
    expiredUsers: 0,
    onlineUsers: 0,
    totalNas: 0,
    onlineNas: 0,
    totalMembers: 0
  };

  userStatus: UserStatus = { online: 0, offline: 0, total: 0 };
  loading = true;
  error: string | null = null;
  
  // Traffic data
  trafficData: any = null;
  
  // Tenant selection
  tenants: Tenant[] = [];
  selectedTenantId: number | null | string = null;
  isSuperAdmin = false;
  
  // Network Traffic Selection
  nasDevices: any[] = [];
  selectedNasDeviceId: number | null = null;
  selectedNasDevice: any = null;
  interfaces: any[] = [];
  selectedInterface: string | null = null;
  isTrafficLoading = false;
  
  // Manual refresh for traffic data
  private trafficChart: any = null;
  private userActivityChart: any = null;
  lastTrafficUpdate: Date | null = null;
  
  // WebSocket monitoring
  isMonitoring = false;
  wsConnected = false;

  constructor(
    private dashboardService: DashboardService,
    private authService: AuthService,
    private tenantService: TenantService,
    private router: Router,
    private webSocketService: WebSocketService
  ) { }

  ngOnInit(): void {
    // Check authentication first
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    
    // Check if user is super admin
    this.isSuperAdmin = this.authService.isSuperAdmin();
    
    // Initialize WebSocket connection
    this.initializeWebSocket();
    
    // Load tenants if super admin, otherwise set current tenant
    if (this.isSuperAdmin) {
      this.loadTenants();
    } else {
      this.selectedTenantId = this.authService.getCurrentUser()?.tenant_id || null;
      this.loadDashboardData();
    }
  }

  ngAfterViewInit(): void {
    // Initialize charts after view is ready
    setTimeout(() => {
      this.initCharts();
    }, 1000);
  }

  ngOnDestroy(): void {
    // Stop WebSocket monitoring
    this.stopMonitoring();
    
    // Disconnect WebSocket
    this.webSocketService.disconnect();
    
    // Clean up chart
    if (this.trafficChart) {
      this.trafficChart.destroy();
    }
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;
    
    const tenantId = this.selectedTenantId === 'null' ? null : (this.selectedTenantId as number | null);

    // Load all dashboard data in parallel
    Promise.all([
      this.dashboardService.getStats(tenantId).toPromise(),
      this.dashboardService.getUserStatus(tenantId).toPromise()
    ]).then(([statsResponse, userStatusResponse]) => {
      // Handle stats
      if (statsResponse?.success) {
        this.stats = statsResponse.data;
      } else {
        this.error = 'Failed to load dashboard statistics';
      }

      // Handle user status
      if (userStatusResponse?.success) {
        this.userStatus = userStatusResponse.data;
        this.updateUserActivityChart();
      } else {
        this.error = 'Failed to load user status';
      }

      this.loading = false;
    }).catch((error) => {
      console.error('Error loading dashboard data:', error);
      this.error = 'Failed to load dashboard data';
      this.loading = false;
    });

    // Load NAS devices for traffic selection (non-blocking)
    this.loadNasDevices(tenantId);
    
    // Clear traffic data when tenant changes
    this.resetTrafficSelection();
  }

  initCharts(): void {
    // Traffic Chart
    this.createTrafficChart();
    
    // User Activity Chart
    this.createUserActivityChart();
  }

  createTrafficChart(): void {
    const ctx = document.getElementById('trafficChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }

    // Default data if no traffic data available
    const defaultData = {
      labels: [],
      rxData: [],
      txData: []
    };

    // Use real timeline data if available
    const chartData = this.trafficData?.timelineData || defaultData;

    this.trafficChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartData.labels || [],
        datasets: [
          {
            label: 'RX (Mbps)',
            data: chartData.rxData || [],
            borderColor: '#28a745',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            tension: 0.4,
            fill: false,
            borderWidth: 2
          },
          {
            label: 'TX (Mbps)',
            data: chartData.txData || [],
            borderColor: '#dc3545',
            backgroundColor: 'rgba(220, 53, 69, 0.1)',
            tension: 0.4,
            fill: false,
            borderWidth: 2
          },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 750 // Smooth animation for live updates
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.1)'
            },
            title: {
              display: true,
              text: 'Traffic (Mbps) - Real-time'
            }
          },
          x: {
            grid: {
              color: 'rgba(0,0,0,0.1)'
            },
            title: {
              display: true,
              text: 'Time'
            }
          }
        }
      }
    });
  }

  updateTrafficChart(): void {
    const ctx = document.getElementById('trafficChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.trafficData?.timelineData) {
      // Update existing chart with new timeline data
      if (this.trafficChart) {
        this.trafficChart.data.labels = this.trafficData.timelineData.labels;
        this.trafficChart.data.datasets[0].data = this.trafficData.timelineData.rxData; // RX
        this.trafficChart.data.datasets[1].data = this.trafficData.timelineData.txData; // TX
        this.trafficChart.update('active'); // Smooth animation
      } else {
        this.createTrafficChart();
      }
    } else {
      // Clear chart if no data
      if (this.trafficChart) {
        this.trafficChart.data.labels = [];
        this.trafficChart.data.datasets[0].data = []; // RX
        this.trafficChart.data.datasets[1].data = []; // TX
        this.trafficChart.update();
      } else {
        this.createTrafficChart();
      }
    }
  }

  createUserActivityChart(): void {
    const ctx = document.getElementById('userActivityChart') as HTMLCanvasElement;
    if (!ctx) return;

    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
      existingChart.destroy();
    }

    this.userActivityChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Online', 'Offline'],
        datasets: [{
          data: [this.userStatus.online, this.userStatus.offline],
          backgroundColor: ['#28a745', '#dc3545'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true
            }
          }
        }
      }
    });
  }

  updateUserActivityChart(): void {
    if (this.userActivityChart) {
      this.userActivityChart.data.datasets[0].data = [this.userStatus.online, this.userStatus.offline];
      this.userActivityChart.update();
    } else {
      this.createUserActivityChart();
    }
  }

  getStatusClass(isOnline: boolean): string {
    return isOnline ? 'text-success' : 'text-danger';
  }


  refreshData(): void {
    this.loadDashboardData();
  }

  loadTenants(): void {
    this.tenantService.getTenants({ limit: 100 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.tenants = response.data.tenants;
          // Auto-select "All Tenants" for super admin
          this.selectedTenantId = null;
          this.loadDashboardData();
        }
      },
      error: (error) => {
        console.error('Error loading tenants:', error);
        this.error = 'Failed to load tenants';
      }
    });
  }

  onTenantChange(): void {
    // Convert string "null" to actual null
    if (this.selectedTenantId === 'null' || this.selectedTenantId === null) {
      this.selectedTenantId = null;
    } else {
      this.selectedTenantId = Number(this.selectedTenantId);
    }
    this.loadDashboardData();
  }

  loadNasDevices(tenantId: number | null): void {
    this.dashboardService.getNasDevices(tenantId).subscribe({
      next: (response) => {
        if (response.success) {
          this.nasDevices = response.data.nasDevices || [];
        }
      },
      error: (error) => {
        console.error('Error loading NAS devices:', error);
      }
    });
  }

  onNasDeviceChange(): void {
    if (!this.selectedNasDeviceId) {
      this.resetTrafficSelection();
      return;
    }

    // Convert to number for comparison
    const nasDeviceId = Number(this.selectedNasDeviceId);
    this.selectedNasDevice = this.nasDevices.find(d => d.id === nasDeviceId);
    
    // Clear interface selection and traffic data
    this.selectedInterface = null;
    this.trafficData = null;
    this.lastTrafficUpdate = null;
    this.updateTrafficChart();
    
    if (this.selectedNasDevice) {
      this.loadInterfaces();
    }
  }

  loadInterfaces(): void {
    if (!this.selectedNasDevice) return;

    this.isTrafficLoading = true;
    this.dashboardService.getNasInterfaces(this.selectedNasDevice.id).subscribe({
      next: (response) => {
        if (response.success && response.data.interfaces) {
          this.interfaces = response.data.interfaces;
        }
        this.isTrafficLoading = false;
      },
      error: (error) => {
        console.error('Error loading interfaces:', error);
        this.isTrafficLoading = false;
      }
    });
  }

  onInterfaceChange(): void {
    if (!this.selectedInterface) {
      this.trafficData = null;
      this.lastTrafficUpdate = null;
      this.updateTrafficChart();
      return;
    }

    // Ensure WebSocket is connected before loading data
    if (!this.wsConnected) {
      this.webSocketService.connect();
    }

    // Load initial data
    this.loadTrafficData(true); // Initial load with spinner
  }

  loadTrafficData(isInitialLoad = false): void {
    if (!this.selectedNasDeviceId || !this.selectedInterface) return;

    // Only show loading spinner on initial load
    if (isInitialLoad) {
      this.isTrafficLoading = true;
    }
    
    const tenantId = this.selectedTenantId === 'null' ? null : (this.selectedTenantId as number | null);
    
    this.dashboardService.getNetworkTraffic(tenantId, this.selectedNasDeviceId, this.selectedInterface).subscribe({
      next: (response) => {
        if (response.success) {
          this.trafficData = response.data;
          this.lastTrafficUpdate = new Date();
          this.updateTrafficChart();
        }
        if (isInitialLoad) {
          this.isTrafficLoading = false;
        }
      },
      error: (error) => {
        console.error('Error loading traffic data:', error);
        if (isInitialLoad) {
          this.isTrafficLoading = false;
        }
      }
    });
  }

  refreshTrafficData(): void {
    if (!this.selectedNasDeviceId || !this.selectedInterface) return;
    
    this.isTrafficLoading = true;
    this.loadTrafficData(false);
  }

  resetTrafficSelection(): void {
    // Stop monitoring before resetting
    this.stopMonitoring();
    
    this.selectedNasDeviceId = null;
    this.selectedNasDevice = null;
    this.interfaces = [];
    this.selectedInterface = null;
    this.trafficData = null;
    this.lastTrafficUpdate = null;
    this.updateTrafficChart();
  }

  // WebSocket Methods
  initializeWebSocket(): void {
    // Subscribe to connection status
    this.webSocketService.connectionStatus$.subscribe(connected => {
      this.wsConnected = connected;
    });

    // Subscribe to traffic data updates
    this.webSocketService.trafficData$.subscribe(data => {
      this.trafficData = data;
      this.lastTrafficUpdate = new Date();
      this.updateTrafficChart();
    });

    // Connect to WebSocket
    this.webSocketService.connect();
  }

  startMonitoring(): void {
    if (!this.selectedNasDeviceId || !this.selectedInterface || !this.wsConnected) {
      return;
    }
    
    this.isMonitoring = true;
    this.webSocketService.startMonitoring(this.selectedNasDeviceId, this.selectedInterface);
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    this.webSocketService.stopMonitoring();
  }

  toggleMonitoring(): void {
    if (this.isMonitoring) {
      this.stopMonitoring();
    } else {
      this.startMonitoring();
    }
  }
}
