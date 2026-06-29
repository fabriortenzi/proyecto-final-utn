import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { OrderService } from '../services/order.service';

interface ShopPaymentRow {
  shop: { id: string; name: string };
  totalAmount: number;
  totalCommissionForDelivery: number;
  totalCommissionService: number;
  totalAmountShop: number;
  mpAmountShop: number;
  cashAmountShop: number;
}

@Component({
  selector: 'app-shop-payments',
  templateUrl: './shop-payments.component.html',
  styleUrls: ['./shop-payments.component.scss'],
})
export class ShopPaymentsComponent implements OnInit {
  displayedColumns: string[] = [
    'shopName',
    'totalAmount',
    'commissionForDelivery',
    'totalAmountShop',
    'mpCommissionService',
    'cashCommissionService',
  ];

  dataSource = new MatTableDataSource<ShopPaymentRow>([]);

  year: number;
  month: number;
  months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(private orderService: OrderService) {
    const now = new Date();
    this.year = now.getFullYear();
    this.month = now.getMonth() + 1;
  }

  ngOnInit() {
    this.loadSummary();
  }

  loadSummary() {
    this.orderService.getShopPaymentsSummary(this.year, this.month).subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
      },
    });
  }
}
