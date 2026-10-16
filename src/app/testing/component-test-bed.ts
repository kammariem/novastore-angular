import { NO_ERRORS_SCHEMA, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { AdminService } from '../services/admin.service';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';
import { CategoryService } from '../services/category.service';
import { ClientService } from '../services/client.service';
import { ImageUploadService } from '../services/image-upload.service';
import { OrderService } from '../services/order.service';
import { ProductService } from '../services/product.service';

const dashboardStats = {
  totalProducts: 0,
  availableProducts: 0,
  outOfStock: 0,
  promotions: 0,
  totalOrders: 0,
  pendingOrders: 0,
  confirmedOrders: 0,
  totalClients: 0,
  totalCategories: 0
};

export function configureComponentTestBed(component: Type<unknown>): void {
  TestBed.configureTestingModule({
    declarations: [component],
    imports: [
      CommonModule,
      FormsModule,
      RouterTestingModule
    ],
    providers: [
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: () => null } } }
      },
      {
        provide: AdminService,
        useValue: {
          getDashboardStats: () => of(dashboardStats),
          getOrders: () => of([])
        }
      },
      {
        provide: AuthService,
        useValue: {
          currentUser$: of(null),
          login: () => Promise.resolve(null),
          logout: () => Promise.resolve(),
          registerClient: () => Promise.resolve(null),
          isAdminEmail: () => false,
          isClientEmail: () => false,
          getRoleByEmail: () => 'guest'
        }
      },
      {
        provide: CartService,
        useValue: {
          items$: of([]),
          getItems: () => [],
          getTotal: () => 0,
          addToCart: () => Promise.resolve(),
          updateQuantity: () => Promise.resolve(),
          remove: () => Promise.resolve(),
          clear: () => Promise.resolve()
        }
      },
      {
        provide: CategoryService,
        useValue: {
          getAll: () => of([]),
          reload: () => Promise.resolve(),
          add: () => Promise.resolve(),
          update: () => Promise.resolve(),
          delete: () => Promise.resolve()
        }
      },
      {
        provide: ClientService,
        useValue: {
          getAll: () => of([]),
          reload: () => Promise.resolve(),
          add: () => Promise.resolve(),
          update: () => Promise.resolve(),
          delete: () => Promise.resolve(),
          syncFromOrders: () => Promise.resolve()
        }
      },
      {
        provide: ImageUploadService,
        useValue: { uploadProductImage: () => Promise.resolve('') }
      },
      {
        provide: OrderService,
        useValue: {
          getAll: () => of([]),
          reload: () => Promise.resolve(),
          create: () => Promise.resolve(),
          updateStatus: () => Promise.resolve()
        }
      },
      {
        provide: ProductService,
        useValue: {
          getAll: () => of([]),
          getFilteredProducts: () => of([]),
          getStockIssues: () => [],
          reload: () => Promise.resolve(),
          reduceStock: () => Promise.resolve(),
          add: () => Promise.resolve(),
          update: () => Promise.resolve(),
          delete: () => Promise.resolve()
        }
      }
    ],
    schemas: [NO_ERRORS_SCHEMA]
  });
}
