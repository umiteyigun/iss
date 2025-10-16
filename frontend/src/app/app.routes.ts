import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginComponent } from './pages/login/login.component';
import { TenantManagementComponent } from './pages/tenant-management/tenant-management.component';
import { NasManagementComponent } from './pages/nas-management/nas-management.component';
import { MemberManagementComponent } from './pages/member-management/member-management.component';
import { UserManagementComponent } from './pages/user-management/user-management.component';
import { PackageManagementComponent } from './pages/package-management/package-management.component';
import { IpManagementComponent } from './pages/ip-management/ip-management.component';
import { RecentActivityComponent } from './pages/recent-activity/recent-activity.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'tenants', component: TenantManagementComponent },
  { path: 'nas', component: NasManagementComponent },
  { path: 'members', component: MemberManagementComponent },
  { path: 'users', component: UserManagementComponent },
  { path: 'packages', component: PackageManagementComponent },
  { path: 'ip', component: IpManagementComponent },
  { path: 'recent-activity', component: RecentActivityComponent },
  { path: '**', redirectTo: '/dashboard' }
];
