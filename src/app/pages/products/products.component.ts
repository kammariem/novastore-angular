import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { Product } from '../../models/product.model';
import { ProductFilter } from '../../models/filter.model';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { ProductFilterComponent } from '../../components/product-filter/product-filter.component';

@Component({
  selector: 'app-products',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  products: Product[] = [];
  loading = true;

  recievedCategoryName: string | null = null;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService,
    private router: Router
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state && navigation.extras.state['categoryName']) {
      this.recievedCategoryName = navigation.extras.state['categoryName'];
    }
  }

  ngOnInit(): void {
    this.productService.getAll().subscribe({
      next: products => {
        this.products = products;
        this.loading = false;

        if (this.recievedCategoryName) {
          this.applyFilter({
            search: '',
            categoryName: this.recievedCategoryName,
            minPrice: undefined,
            maxPrice: undefined,
            available: null,
            promotion: null
          });
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  applyFilter(filter: ProductFilter): void {
    this.loading = true;

    this.productService.getFilteredProducts(filter).subscribe(products => {
      this.products = products;
      this.loading = false;
    });
  }

  addToCart(product: Product): void {
    this.authService.currentUser$.pipe(take(1)).subscribe(user => {
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      if (user.role === 'admin') {
        alert('Le compte admin ne peut pas commander. Connectez-vous avec le compte client.');
        return;
      }

      this.cartService.addToCart(product);
      this.router.navigate(['/cart']);
    });
  }

  viewDetails(product: Product): void {
    this.router.navigate(['/products', product.id]);
  }
}
