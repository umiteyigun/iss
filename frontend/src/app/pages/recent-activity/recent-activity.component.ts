import { Component, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ActivityService, RecentSession, ActivityUser, UserHistoryItem } from '../../services/activity.service';
import { Chart, ChartConfiguration, ChartData, ChartOptions } from 'chart.js';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-recent-activity',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './recent-activity.component.html',
  styleUrls: ['./recent-activity.component.scss']
})
export class RecentActivityComponent implements OnInit, OnDestroy, AfterViewInit {
  // Recent sessions table (limited to 15 records, no pagination)
  sessions: RecentSession[] = [];
  sessionsSearch = '';
  sessionsTenantFilter = '';
  loadingSessions = false;

  // Users table
  users: ActivityUser[] = [];
  usersPage = 1;
  usersLimit = 15;
  usersTotal = 0;
  usersSearch = '';
  usersTenantFilter = '';
  loadingUsers = false;

  // Tenants for filter
  tenants: any[] = [];

  // User info
  currentUser: any = null;
  isSuperAdmin = false;

  // Modal
  showHistoryModal = false;
  modalUsername: string | null = null;
  historyItems: UserHistoryItem[] = [];
  loadingHistory = false;

  // Math reference for template
  Math = Math;

  // Chart references
  @ViewChild('trafficChart', { static: false }) trafficChartRef!: ElementRef<HTMLCanvasElement>;
  private trafficChart: Chart | null = null;

  constructor(private activityService: ActivityService, private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.isSuperAdmin = this.currentUser?.role === 'super_admin' || this.currentUser?.tenantId === 0;
    
    this.fetchSessions();
    this.fetchUsers();
    if (this.isSuperAdmin) {
      this.fetchTenants();
    }
  }

  ngAfterViewInit(): void {
    // Chart will be initialized when modal opens
  }

  ngOnDestroy(): void {
    if (this.trafficChart) {
      this.trafficChart.destroy();
    }
  }

  fetchSessions(): void {
    if (this.loadingSessions) return; // Prevent multiple calls
    this.loadingSessions = true;
    this.activityService.getRecentSessions(1, 15, this.sessionsSearch, this.sessionsTenantFilter) // Always get first 15 records
      .subscribe({
        next: (resp) => {
          this.sessions = resp.data.sessions;
          this.loadingSessions = false;
        },
        error: (error) => { 
          console.error('Sessions fetch error:', error);
          this.loadingSessions = false; 
        }
      });
  }

  fetchUsers(): void {
    if (this.loadingUsers) return; // Prevent multiple calls
    this.loadingUsers = true;
    this.activityService.getUsers(this.usersPage, this.usersLimit, this.usersSearch, this.usersTenantFilter)
      .subscribe({
        next: (resp) => {
          this.users = resp.data.users;
          this.usersTotal = resp.data.pagination.total;
          this.loadingUsers = false;
        },
        error: (error) => {
          console.error('Users fetch error:', error);
          this.loadingUsers = false;
        }
      });
  }

  fetchTenants(): void {
    this.activityService.getTenants().subscribe({
      next: (resp) => {
        this.tenants = resp.data.tenants || [];
      },
      error: (error) => {
        console.error('Tenants fetch error:', error);
      }
    });
  }

  openHistory(username: string): void {
    this.modalUsername = username;
    this.showHistoryModal = true;
    this.loadingHistory = true;
    this.historyItems = [];
    this.activityService.getUserHistory(username, 10).subscribe({
      next: (resp) => {
        this.historyItems = resp.data.history;
        this.loadingHistory = false;
        // Initialize chart after data is loaded
        setTimeout(() => {
          this.initializeTrafficChart();
        }, 100);
      },
      error: () => { this.loadingHistory = false; }
    });
  }

  closeHistory(): void {
    this.showHistoryModal = false;
    this.modalUsername = null;
    this.historyItems = [];
    // Destroy chart when modal closes
    if (this.trafficChart) {
      this.trafficChart.destroy();
      this.trafficChart = null;
    }
  }

  // Search handlers
  onSessionsSearch(): void {
    this.fetchSessions(); // No pagination for sessions
  }

  onSessionsTenantFilterChange(): void {
    this.fetchSessions(); // No pagination for sessions
  }

  onUsersSearch(): void {
    this.usersPage = 1;
    this.fetchUsers();
  }

  onTenantFilterChange(): void {
    this.usersPage = 1; // Reset to first page
    this.fetchUsers();
  }

  // Pagination handlers (only for users)
  // Sessions don't have pagination - always show latest 15

  onUsersPageChange(page: number): void {
    if (page >= 1 && page <= Math.ceil(this.usersTotal / this.usersLimit)) {
      this.usersPage = page;
      this.fetchUsers();
    }
  }

  // Helpers
  formatBytes(value: number): string {
    if (!value || value === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let v = value;
    let idx = 0;
    while (v >= 1024 && idx < units.length - 1) {
      v /= 1024;
      idx++;
    }
    return `${v.toFixed(2)} ${units[idx]}`;
  }

  formatDuration(seconds: number | null): string {
    if (!seconds || seconds === 0 || seconds === null) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  getStatusBadge(session: any): string {
    if (session.acctstoptime) {
      return 'badge-success'; // Completed
    } else if (session.acctstarttime) {
      return 'badge-warning'; // Active
    } else {
      return 'badge-secondary'; // Unknown
    }
  }

  getStatusText(session: any): string {
    if (session.acctstoptime) {
      return 'Completed';
    } else if (session.acctstarttime) {
      return 'Active';
    } else {
      return 'Unknown';
    }
  }

  private initializeTrafficChart(): void {
    if (!this.trafficChartRef || this.historyItems.length === 0) {
      return;
    }

    // Destroy existing chart
    if (this.trafficChart) {
      this.trafficChart.destroy();
    }

    // Prepare data for chart
    const labels = this.historyItems.map((item, index) => {
      if (!item.acctstarttime) return 'Bilinmiyor';
      const date = new Date(item.acctstarttime);
      return `${date.getDate()}/${date.getMonth() + 1} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    }).reverse(); // Show oldest first

    // Convert bytes to MB
    const uploadData = this.historyItems.map(item => (item.upload_octets || 0) / (1024 * 1024)).reverse();
    const downloadData = this.historyItems.map(item => (item.download_octets || 0) / (1024 * 1024)).reverse();

    const chartConfig: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Upload (MB)',
            data: uploadData,
            borderColor: '#28a745',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Download (MB)',
            data: downloadData,
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `${this.modalUsername} - Trafik Grafiği`,
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Tarih/Saat'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: 'Megabytes (MB)'
            },
            beginAtZero: true
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    };

    this.trafficChart = new Chart(this.trafficChartRef.nativeElement, chartConfig);
  }
}


