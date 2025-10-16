import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Subject, takeUntil, interval } from 'rxjs';
import { NasService } from '../../services/nas.service';

export interface MikrotikInfo {
  timestamp: string;
  ip: string;
  system: {
    cpu: number;
    memory: {
      total: number;
      used: number;
      free: number;
    };
    disk: {
      total: number;
      used: number;
      free: number;
    };
    uptime: string;
    version: string;
    architecture: string;
    board_name: string;
    resource?: {
      uptime: string;
      version: string;
      'architecture-name': string;
      'board-name': string;
      'cpu-load': string;
      [key: string]: any;
    };
  };
  pppoe: {
    active_users: number;
    users: Array<{
      name: string;
      address: string;
      uptime: string;
      bytes_in: number;
      bytes_out: number;
    }>;
  };
  interfaces: {
    interfaces: Array<{
      name: string;
      type: string;
      running: boolean;
      disabled: boolean;
      rx_byte: number;
      tx_byte: number;
      rx_packet: number;
      tx_packet: number;
    }>;
  };
}

@Component({
  selector: 'app-mikrotik-info-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './mikrotik-info-modal.component.html',
  styleUrls: ['./mikrotik-info-modal.component.scss']
})
export class MikrotikInfoModalComponent implements OnInit, OnDestroy, OnChanges {
  private nasService = inject(NasService);
  
  @Input() isOpen = false;
  @Input() nasDevice: any = null;
  @Output() close = new EventEmitter<void>();

  mikrotikInfo: MikrotikInfo | null = null;
  loading = false;
  error: string | null = null;
  autoRefresh = false;
  refreshInterval = 5000; // 5 seconds
  lastUpdate: Date | null = null;

  // Custom credentials
  customUsername = '';
  customPassword = '';
  useCustomCredentials = false;

  // Performance optimizations
  showPppoeUsers = true;
  showInterfaces = true;
  maxPppoeUsers = 20; // Limit displayed users
  maxInterfaces = 50; // Limit displayed interfaces

  private destroy$ = new Subject<void>();
  private refreshTimer: any = null;

  ngOnInit(): void {
    if (this.isOpen && this.nasDevice) {
      this.loadMikrotikInfo();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopAutoRefresh();
  }

  ngOnChanges(): void {
    if (this.isOpen && this.nasDevice) {
      this.loadMikrotikInfo();
    } else {
      this.stopAutoRefresh();
    }
  }

  loadMikrotikInfo(): void {
    if (!this.nasDevice) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.nasService.getMikrotikInfo(this.nasDevice.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.mikrotikInfo = response.data;
            this.lastUpdate = new Date();
            this.error = null;
          } else {
            this.error = response.message || 'Failed to load Mikrotik information';
            this.mikrotikInfo = null;
          }
          this.loading = false;
        },
        error: (err: any) => {
          console.error('MikrotikModal: Error loading Mikrotik info:', err);
          this.error = 'Failed to load Mikrotik information. Please try again.';
          this.mikrotikInfo = null;
          this.loading = false;
        }
      });
  }

  onClose(): void {
    this.stopAutoRefresh();
    this.close.emit();
  }

  toggleAutoRefresh(): void {
    this.autoRefresh = !this.autoRefresh;
    if (this.autoRefresh) {
      this.startAutoRefresh();
    } else {
      this.stopAutoRefresh();
    }
  }

  private startAutoRefresh(): void {
    this.stopAutoRefresh();
    this.refreshTimer = interval(this.refreshInterval)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadMikrotikInfo();
      });
  }

  private stopAutoRefresh(): void {
    if (this.refreshTimer) {
      this.refreshTimer.unsubscribe();
      this.refreshTimer = null;
    }
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatUptime(uptime: string): string {
    // Mikrotik uptime format: "1w2d3h4m5s"
    const match = uptime.match(/(\d+)w(\d+)d(\d+)h(\d+)m(\d+)s/);
    if (match) {
      const [, weeks, days, hours, minutes, seconds] = match;
      return `${weeks}w ${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
    return uptime;
  }

  getMemoryUsagePercentage(): number {
    if (!this.mikrotikInfo?.system?.memory) return 0;
    const { total, used } = this.mikrotikInfo.system.memory;
    return total > 0 ? (used / total) * 100 : 0;
  }

  getDiskUsagePercentage(): number {
    if (!this.mikrotikInfo?.system?.disk) return 0;
    const { total, used } = this.mikrotikInfo.system.disk;
    return total > 0 ? (used / total) * 100 : 0;
  }

  getCpuColor(cpu: number): string {
    if (cpu < 50) return 'success';
    if (cpu < 80) return 'warning';
    return 'danger';
  }

  getMemoryColor(percentage: number): string {
    if (percentage < 70) return 'success';
    if (percentage < 90) return 'warning';
    return 'danger';
  }

  getDiskColor(percentage: number): string {
    if (percentage < 80) return 'success';
    if (percentage < 95) return 'warning';
    return 'danger';
  }

  // Performance getters
  get filteredPppoeUsers() {
    if (!this.mikrotikInfo?.pppoe?.users) return [];
    return this.mikrotikInfo.pppoe.users.slice(0, this.maxPppoeUsers);
  }

  get filteredInterfaces() {
    if (!this.mikrotikInfo?.interfaces?.interfaces) return [];
    return this.mikrotikInfo.interfaces.interfaces.slice(0, this.maxInterfaces);
  }

  get hasMorePppoeUsers() {
    return (this.mikrotikInfo?.pppoe?.users?.length || 0) > this.maxPppoeUsers;
  }

  get hasMoreInterfaces() {
    return (this.mikrotikInfo?.interfaces?.interfaces?.length || 0) > this.maxInterfaces;
  }

  togglePppoeUsers() {
    this.showPppoeUsers = !this.showPppoeUsers;
  }

  toggleInterfaces() {
    this.showInterfaces = !this.showInterfaces;
  }

  loadMorePppoeUsers() {
    this.maxPppoeUsers += 20;
  }

  loadMoreInterfaces() {
    this.maxInterfaces += 50;
  }

  // TrackBy functions for performance
  trackByUsername(index: number, user: any): string {
    return user.name;
  }

  trackByInterfaceName(index: number, iface: any): string {
    return iface.name;
  }
}
