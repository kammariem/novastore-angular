import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Product } from '../models/product.model';
import { environment } from '../../environments/environment';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let http: HttpTestingController;

  const product: Product = {
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
    promotion: false,
    createdAt: '2026-01-01T00:00:00.000Z'
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductService]
    });
    service = TestBed.inject(ProductService);
    http = TestBed.inject(HttpTestingController);
    http.expectOne(`${environment.apiUrl}/products`).flush([]);
  });

  afterEach(() => http.verify());

  it('omits the server-managed product id and timestamp from create payloads', async () => {
    const creation = service.add(product);
    const request = http.expectOne(`${environment.apiUrl}/products`);

    expect(request.request.method).toBe('POST');
    expect(request.request.body.id).toBeUndefined();
    expect(request.request.body.createdAt).toBeUndefined();
    expect(request.request.body.name).toBe('Test product');
    request.flush(product);

    await creation;
  });

  it('omits the server-managed timestamp from product update payloads', async () => {
    const creation = service.add(product);
    http.expectOne(`${environment.apiUrl}/products`).flush(product);
    await creation;

    const update = service.update('product-1', { name: 'Updated product' });
    const request = http.expectOne(`${environment.apiUrl}/products/product-1`);

    expect(request.request.method).toBe('PUT');
    expect(request.request.body.id).toBeUndefined();
    expect(request.request.body.createdAt).toBeUndefined();
    expect(request.request.body.name).toBe('Updated product');
    request.flush({ ...product, name: 'Updated product' });

    await update;
  });
});
