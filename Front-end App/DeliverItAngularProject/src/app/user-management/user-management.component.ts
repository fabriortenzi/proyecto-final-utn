import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { User } from '../entities/user.entity';
import { UserService } from '../services/user.service';
import { LoginService } from '../services/login.service';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss'],
})
export class UserManagementComponent implements OnInit {
  displayedColumns: string[] = ['name', 'surname', 'email', 'userType', 'enabled'];
  dataSource = new MatTableDataSource<User>([]);

  emailFilter = '';
  roleFilter = 'all';

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private userService: UserService,
    private loginService: LoginService,
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    const loggedUserId = this.loginService.getLoggedUser().id;
    this.userService.getAll().subscribe({
      next: (users) => {
        this.dataSource.data = users.filter(u => u.id !== loggedUserId);
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
        this.applyFilters();
      },
    });
  }

  applyFilters() {
    this.dataSource.filterPredicate = (data: User, filter: string) => {
      const filters = JSON.parse(filter);
      const matchesEmail = data.email.toLowerCase().includes(filters.email.toLowerCase());
      const matchesRole = filters.role === 'all' || data.userType.description === filters.role;
      return matchesEmail && matchesRole;
    };
    this.dataSource.filter = JSON.stringify({ email: this.emailFilter, role: this.roleFilter });
  }

  toggleEnabled(user: User) {
    this.userService.toggleEnabled(user.id, !user.enabled).subscribe({
      next: () => {
        user.enabled = !user.enabled;
        this.dataSource.data = [...this.dataSource.data];
      },
    });
  }
}
