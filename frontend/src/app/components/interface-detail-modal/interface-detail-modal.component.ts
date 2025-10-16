import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-interface-detail-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './interface-detail-modal.component.html',
  styleUrls: ['./interface-detail-modal.component.scss']
})
export class InterfaceDetailModalComponent implements OnInit, OnChanges {
  @Input() interfaceData: any = null;
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  // Interface data for editing
  editedInterface: any = {};

  // Interface types for dropdown
  interfaceTypes = [
    { value: 'ether', label: 'Ethernet' },
    { value: 'wlan', label: 'Wireless' },
    { value: 'bridge', label: 'Bridge' },
    { value: 'vlan', label: 'VLAN' },
    { value: 'bond', label: 'Bonding' },
    { value: 'pppoe-out', label: 'PPPoE Client' },
    { value: 'pppoe-in', label: 'PPPoE Server' },
    { value: 'vpn', label: 'VPN' },
    { value: 'tunnel', label: 'Tunnel' },
    { value: 'vrrp', label: 'VRRP' },
    { value: 'loopback', label: 'Loopback' },
    { value: 'ovpn-out', label: 'OpenVPN Client' },
    { value: 'ovpn-in', label: 'OpenVPN Server' },
    { value: 'sstp-out', label: 'SSTP Client' },
    { value: 'sstp-in', label: 'SSTP Server' },
    { value: 'l2tp-out', label: 'L2TP Client' },
    { value: 'l2tp-in', label: 'L2TP Server' },
    { value: 'pptp-out', label: 'PPTP Client' },
    { value: 'pptp-in', label: 'PPTP Server' },
    { value: 'gre', label: 'GRE Tunnel' },
    { value: 'eoip', label: 'EoIP Tunnel' },
    { value: 'ipip', label: 'IPIP Tunnel' },
    { value: 'sit', label: 'SIT Tunnel' },
    { value: '6to4', label: '6to4 Tunnel' },
    { value: 'lte', label: 'LTE' },
    { value: 'wds', label: 'WDS' },
    { value: 'mesh', label: 'Mesh' },
    { value: 'cap', label: 'CAPsMAN' },
    { value: 'dynamic', label: 'Dynamic' }
  ];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.resetForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['interfaceData'] && this.interfaceData) {
      this.resetForm();
    }
  }

  resetForm(): void {
    if (this.interfaceData) {
      
      // Create a completely new object with explicit field assignment
      const newEditedInterface = {
        name: String(this.interfaceData.name || 'N/A'), // Force string conversion
        type: String(this.interfaceData.type || ''),
        running: this.interfaceData.running === 'true' || this.interfaceData.running === true,
        disabled: this.interfaceData.disabled === 'true' || this.interfaceData.disabled === true,
        mtu: parseInt(this.interfaceData.mtu) || 1500,
        macAddress: String(this.interfaceData.macAddress || this.interfaceData.mac_address || this.interfaceData['mac-address'] || ''),
        comment: String(this.interfaceData.comment || ''), // Force string conversion
        // VLAN specific
        vlanId: this.interfaceData.vlanId || this.interfaceData['vlan-id'] || '',
        interface: this.interfaceData.interface || '',
        // Bond specific
        mode: this.interfaceData.mode || '',
        slaves: this.interfaceData.slaves || '',
        // PPPoE specific
        user: this.interfaceData.user || '',
        service: this.interfaceData.service || '',
        // VPN specific
        remoteAddress: this.interfaceData.remoteAddress || this.interfaceData['remote-address'] || '',
        localAddress: this.interfaceData.localAddress || this.interfaceData['local-address'] || '',
        // Bridge specific
        ports: this.interfaceData.ports || '',
        protocol: this.interfaceData.protocol || ''
      };
      
      
      // Assign the new object
      this.editedInterface = newEditedInterface;
      
      // Force change detection
      this.cdr.detectChanges();
      
    } else {
      // Reset to empty object if no data
      this.editedInterface = {
        name: '',
        type: '',
        running: false,
        disabled: false,
        mtu: 1500,
        macAddress: '',
        comment: ''
      };
      this.cdr.detectChanges();
    }
  }

  onClose(): void {
    this.close.emit();
  }

  onSave(): void {
    this.save.emit(this.editedInterface);
  }

  onCancel(): void {
    this.resetForm();
    this.close.emit();
  }

  // Helper methods for different interface types
  isEthernet(): boolean {
    return this.editedInterface.type === 'ether';
  }

  isWireless(): boolean {
    return this.editedInterface.type === 'wlan';
  }

  isBridge(): boolean {
    return this.editedInterface.type === 'bridge';
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
