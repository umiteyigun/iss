import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BtkLogsService, BtkLogExport } from '../../services/btk-logs.service';
import { AuthService } from '../../services/auth.service';
import { TenantService } from '../../services/tenant.service';

@Component({
  selector: 'app-btk-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './btk-logs.component.html',
  styleUrls: ['./btk-logs.component.scss']
})
export class BtkLogsComponent implements OnInit {
  exports: BtkLogExport[] = [];
  page = 1;
  limit = 25;
  total = 0;
  pages = 1;
  loading = false;
  running = false;
  message = '';
  tenants: any[] = [];
  tenantFilter = '';
  isSuperAdmin = false;
  verifyResult: Record<number, { valid: boolean; sha256_match: boolean; hmac_match: boolean }> = {};
  clockOk = true;
  clockInfo = '';

  constructor(
    private btkLogsService: BtkLogsService,
    private authService: AuthService,
    private tenantService: TenantService
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.isSuperAdmin = user?.role === 'super_admin' || user?.tenant_id === 0;
    if (this.isSuperAdmin) {
      this.tenantService.getTenants().subscribe({
        next: (r: any) => { this.tenants = r?.data?.tenants || r?.data || []; },
        error: () => {}
      });
    }
    this.load();
    this.checkClock();
  }

  checkClock(): void {
    this.btkLogsService.getTimeStatus().subscribe({
      next: (r) => {
        this.clockOk = r.data?.ok !== false;
        const d = r.data;
        this.clockInfo = d
          ? `Saat: MySQL ${d.timezone_offset || '+03:00'} · drift ${d.drift_ms}ms`
          : '';
      },
      error: (e) => {
        this.clockOk = false;
        this.clockInfo = e?.error?.message || 'Saat senkronu kontrol edilemedi';
      }
    });
  }

  load(): void {
    this.loading = true;
    const tid = this.tenantFilter ? parseInt(this.tenantFilter, 10) : undefined;
    this.btkLogsService.list(this.page, this.limit, tid).subscribe({
      next: (resp) => {
        this.exports = resp.data.exports;
        this.total = resp.data.pagination.total;
        this.pages = resp.data.pagination.pages;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.message = 'Liste yüklenemedi';
      }
    });
  }

  onFilterChange(): void {
    this.page = 1;
    this.load();
  }

  download(exp: BtkLogExport): void {
    this.btkLogsService.downloadZip(exp.id).subscribe({
      next: (resp) => {
        const blob = resp.body;
        if (!blob) {
          this.message = 'ZIP indirilemedi';
          return;
        }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${exp.filename}.zip`;
        a.click();
        URL.revokeObjectURL(a.href);
      },
      error: () => { this.message = 'ZIP indirilemedi (dosya yoksa backend zip kurulumunu kontrol edin)'; }
    });
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.load();
    }
  }

  nextPage(): void {
    if (this.page < this.pages) {
      this.page++;
      this.load();
    }
  }

  verify(exp: BtkLogExport): void {
    this.btkLogsService.verify(exp.id).subscribe({
      next: (r) => {
        this.verifyResult[exp.id] = r.data;
      },
      error: () => { this.message = 'Doğrulama başarısız'; }
    });
  }

  runNow(): void {
    if (!confirm('Son saat için BTK log üretilsin mi?')) return;
    this.running = true;
    this.message = '';
    this.btkLogsService.runExport(false).subscribe({
      next: (r) => {
        this.running = false;
        const ok = (r.data?.summary || []).filter((s: any) => !s.skipped && !s.error);
        this.message = ok.length
          ? `${ok.length} tenant için saatlik arşiv üretildi`
          : 'Üretilmedi (kapalı veya bu saat zaten arşivlendi)';
        this.load();
      },
      error: () => {
        this.running = false;
        this.message = 'Üretim başarısız';
      }
    });
  }

  formatHour(d: string): string {
    if (!d) return '-';
    const tz = 'Europe/Istanbul';
    const parts = new Intl.DateTimeFormat('tr-TR', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).formatToParts(new Date(d));
    const pick = (type: string) => parts.find((p) => p.type === type)?.value || '';
    return `${pick('day')}.${pick('month')}.${pick('year')} ${pick('hour')}:${pick('minute')}:${pick('second')} +03:00`;
  }
}
