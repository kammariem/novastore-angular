import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { HomeComponent } from './pages/home/home.component';
import { ProductsComponent } from './pages/products/products.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { CartComponent } from './pages/cart/cart.component';
import { OrdersComponent } from './pages/orders/orders.component';
import { OrderHistoryComponent } from './pages/orders/order-history.component';
import { LoginComponent } from './pages/login/login.component';

import { AdminLayoutComponent } from './components/admin-layout/admin-layout.component';
import { DashboardComponent } from './pages/admin/dashboard/dashboard.component';
import { ProductsAdminComponent } from './pages/admin/products/products-admin.component';
import { OrdersAdminComponent } from './pages/admin/orders/orders-admin.component';
import { CategoriesAdminComponent } from './pages/admin/categories/categories-admin.component';
import { ClientsAdminComponent } from './pages/admin/clients/clients-admin.component';

import { AdminGuard } from './guards/admin.guard';
import { ClientGuard } from './guards/client.guard';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },

  // Pages client / boutique
  { path: 'products', component: ProductsComponent },
  { path: 'products/:id', component: ProductDetailComponent },
  { path: 'cart', component: CartComponent, canActivate: [ClientGuard] },
  { path: 'orders', component: OrdersComponent, canActivate: [ClientGuard] },
  { path: 'my-orders', component: OrderHistoryComponent, canActivate: [ClientGuard] },

  // Espace admin séparé avec sidebar
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'categories', component: CategoriesAdminComponent },
      { path: 'products', component: ProductsAdminComponent },
      { path: 'orders', component: OrdersAdminComponent },
      { path: 'clients', component: ClientsAdminComponent }
    ]
  },

  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
