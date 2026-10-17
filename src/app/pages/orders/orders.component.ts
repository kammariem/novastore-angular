import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.css']
})
export class OrdersComponent {
  client = {
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: ''
  };

  successMessage = '';
  errorMessage = '';

  constructor(
    public cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    private productService: ProductService,
    private router: Router
  ) {
    this.authService.currentUser$.pipe(take(1)).subscribe(user => {
      this.client = {
        clientName: user?.name || '',
        clientEmail: user?.email || '',
        clientPhone: user?.phone || '',
        clientAddress: user?.address || ''
      };
    });
  }

  submitOrder(): void {
    const items = this.cartService.getItems();
    this.errorMessage = '';
    this.successMessage = '';

    if (items.length === 0) {
      this.errorMessage = 'Le panier est vide.';
      this.router.navigate(['/products']);
      return;
    }

    if (!this.client.clientName || !this.client.clientPhone || !this.client.clientAddress) {
      this.errorMessage = 'Merci de remplir le nom, le téléphone et l’adresse de livraison.';
      return;
    }

    const stockIssues = this.productService.getStockIssues(items);

    if (stockIssues.length > 0) {
      this.errorMessage = `Stock insuffisant : ${stockIssues.join(', ')}`;
      return;
    }

    this.orderService.create({
      ...this.client,
      items,
      total: this.cartService.getTotal()
    }).then(() => {
        this.cartService.clear();
        this.successMessage = 'Commande envoyée avec succès. Le stock a été mis à jour.';
        this.client = {
          clientName: '',
          clientEmail: this.client.clientEmail,
          clientPhone: '',
          clientAddress: ''
        };
        return this.productService.reload().catch(() => {
          this.errorMessage = 'Commande enregistrée, mais le catalogue n’a pas pu être actualisé.';
        });
      })
      .catch(error => {
        this.errorMessage = error?.status === 409
          ? 'Un produit n’est plus disponible en quantité suffisante. Vérifiez le panier.'
          : 'Impossible d’enregistrer la commande. Veuillez réessayer.';
      });
  }
}
