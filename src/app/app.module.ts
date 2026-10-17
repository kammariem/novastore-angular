import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';

import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { ProductCardComponent } from './components/product-card/product-card.component';
import { ProductFilterComponent } from './components/product-filter/product-filter.component';
import { SearchBarComponent } from './components/search-bar/search-bar.component';
import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';

import { HomeComponent } from './pages/home/home.component';
import { ProductsComponent } from './pages/products/products.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { CartComponent } from './pages/cart/cart.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { OrderHistoryComponent } from './pages/orders/order-history.component';
import { LoginComponent } from './pages/login/login.component';

import { DashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { ProductsAdminComponent } from './pages/admin/products/products-admin.component';
import { OrdersAdminComponent } from './pages/admin/orders/orders-admin.component';
import { CategoriesAdminComponent } from './pages/admin/categories/categories-admin.component';
import { ClientsAdminComponent } from './pages/admin/clients/clients-admin.component';
import { SalesOverviewChartComponent } from './pages/admin/dashboard/sales-overview-chart/sales-overview-chart.component';
import { InventoryChartComponent } from './pages/admin/dashboard/inventory-chart/inventory-chart.component';
import { SalesTrendComponent } from './pages/admin/dashboard/sales-trend/sales-trend.component';
import { ProductPerformanceComponent } from './pages/admin/dashboard/product-performance/product-performance.component';
import { OrderStatusComponent } from './pages/admin/dashboard/order-status/order-status.component';
import { CategoryRevenueComponent } from './pages/admin/dashboard/category-revenue/category-revenue.component';
import { PriceDistributionComponent } from './pages/admin/dashboard/price-distribution/price-distribution.component';

@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    FooterComponent,
    ProductCardComponent,
    ProductFilterComponent,
    SearchBarComponent,
    AdminLayoutComponent,
    HomeComponent,
    ProductsComponent,
    ProductDetailComponent,
    CartComponent,
    OrdersComponent,
    OrderHistoryComponent,
    LoginComponent,
    DashboardComponent,
    CategoriesAdminComponent,
    ProductsAdminComponent,
    OrdersAdminComponent,
    ClientsAdminComponent,
    SalesOverviewChartComponent,
    InventoryChartComponent,
    SalesTrendComponent,
    ProductPerformanceComponent,
    OrderStatusComponent,
    CategoryRevenueComponent,
    PriceDistributionComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
