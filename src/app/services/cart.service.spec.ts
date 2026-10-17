import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [CartService] });
    service = TestBed.inject(CartService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('persists cart additions and quantity updates in localStorage', async () => {
    await service.addToCart({
      id: 'product-1',
      name: 'Test product',
      description: 'Product description',
      price: 12.5,
      currency: 'TND',
      categoryId: 'test',
      categoryName: 'Test',
      type: 'Robe',
      image: 'product.jpg',
      stock: 4,
      available: true,
      promotion: false
    });
    await service.updateQuantity('product-1', 2);

    expect(service.getItems()[0].quantity).toBe(2);
    expect(service.getTotal()).toBe(25);
    expect(JSON.parse(localStorage.getItem('novastore.cart') || '[]')[0].quantity).toBe(2);
  });

  it('ignores malformed persisted cart entries and recovers valid entries', async () => {
    localStorage.setItem('novastore.cart', JSON.stringify([
      { productId: 'bad-quantity', productName: 'Invalid', quantity: -1, price: 2 },
      { productId: 'valid', productName: 'Valid', quantity: 1, price: 4 }
    ]));

    await service.reload();

    expect(service.getItems().length).toBe(1);
    expect(service.getItems()[0].productId).toBe('valid');
  });
});
