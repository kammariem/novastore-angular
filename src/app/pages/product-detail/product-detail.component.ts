import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map, take } from 'rxjs';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  product?: Product;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    this.productService.getAll()
      .pipe(map(products => products.find(product => product.id === id)))
      .subscribe(product => this.product = product);
  }

  addToCart(): void {
    if (!this.product) {
      return;
    }

    this.authService.currentUser$.pipe(take(1)).subscribe(user => {
      if (!user) {
        this.router.navigate(['/login']);
        return;
      }

      if (this.authService.isAdminEmail(user.email)) {
        alert('Le compte admin ne peut pas commander.');
        return;
      }

      this.cartService.addToCart(this.product as Product);
      this.router.navigate(['/cart']);
    });
  }
}
