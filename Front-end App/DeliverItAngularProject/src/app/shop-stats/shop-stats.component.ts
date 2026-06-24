import { Component } from '@angular/core';
import { Shop } from '../entities/shop.entity';
import { ProductCategory } from '../entities/productCategory.entity';
import {
  StatsService,
  statsType,
  weeklySaleType,
} from '../services/stats.service';
import { ProductCategoryService } from '../services/product-category.service';
import Plotly from 'plotly.js-dist';

@Component({
  selector: 'app-shop-stats',
  templateUrl: './shop-stats.component.html',
  styleUrls: ['./shop-stats.component.scss'],
})
export class ShopStatsComponent {
  protected shop: Shop;
  protected stats: statsType;
  protected date = new Date().toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
  });
  protected categories: ProductCategory[] = [];
  protected selectedCategoryIds: string[] = [];
  protected showDropdown = false;
  protected weeklySales: weeklySaleType[] = [];

  constructor(
    private statsService: StatsService,
    private productCategoryService: ProductCategoryService,
  ) {}

  ngOnInit() {
    this.shop = this.statsService.getShop();
    this.loadCategories();
    this.loadStats();
  }

  loadStats() {
    this.statsService
      .getStats(this.selectedCategoryIds)
      .subscribe((response: any) => {
        this.stats = response.body.stats;
        this.weeklySales = response.body.weeklySales;

        this.renderBarChart();
        this.renderLineChart();
      });
  }

  loadCategories() {
    this.productCategoryService.getAll().subscribe((response: any) => {
      this.categories = response.body;
    });
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  onCategoryToggle(id: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedCategoryIds.push(id);
    } else {
      this.selectedCategoryIds = this.selectedCategoryIds.filter(
        (c) => c !== id,
      );
    }
    this.loadStats();
  }

  renderBarChart() {
    let xValue: number[] = [];
    let yValue: string[] = [];

    this.stats.topProducts.forEach((element) => {
      yValue.unshift(element.product.name);
      xValue.unshift(element.amount);
    });

    const data: Partial<Plotly.PlotData>[] = [
      {
        x: xValue,
        y: yValue,
        text: xValue.map(String),
        type: 'bar',
        orientation: 'h',
        marker: {
          color: 'rgba(243,181,181,0.5)',
          width: 0.5,
        },
      },
    ];

    const layout: Partial<Plotly.Layout> = {
      showlegend: false,
      xaxis: {
        title: 'Unidades',
      },
      font: {
        family: 'Arial',
        size: 13,
      },
      margin: {
        t: 5,
        l: 110,
      },
      legend: {
        font: {
          family: 'Arial',
          size: 11,
        },
        itemwidth: 10,
      },
      paper_bgcolor: 'rgb(245,245,245)',
      plot_bgcolor: 'rgb(245,245,245)',
    };

    Plotly.newPlot('barChart', data, layout, {
      staticPlot: true,
      responsive: true,
    });
  }

  renderLineChart() {
    const xValue = this.weeklySales.map(
      (s) => `Sem ${s._id.week}/${s._id.year}`,
    );
    const yValue = this.weeklySales.map((s) => s.totalSales);

    const data: Partial<Plotly.PlotData>[] = [
      {
        x: xValue,
        y: yValue,
        type: 'scatter',
        mode: 'lines+markers',
        marker: {
          color: 'rgba(192,10,10,0.8)',
          size: 8,
        },
        line: {
          color: 'rgba(192,10,10,0.6)',
          width: 2,
        },
      },
    ];

    const layout: Partial<Plotly.Layout> = {
      showlegend: false,
      xaxis: {
        title: 'Período',
      },
      yaxis: {
        title: 'Monto ($)',
      },
      font: {
        family: 'Arial',
        size: 13,
      },
      margin: {
        t: 5,
        l: 60,
      },
      paper_bgcolor: 'rgb(245,245,245)',
      plot_bgcolor: 'rgb(245,245,245)',
    };

    Plotly.newPlot('lineChart', data, layout, {
      staticPlot: true,
      responsive: true,
    });
  }
}

