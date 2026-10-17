import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom, map } from 'rxjs';
import { Product } from '../models/product.model';
import { ProductFilter } from '../models/filter.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = `${environment.apiUrl}/products`;
  private productsSubject = new BehaviorSubject<Product[]>([]);

  constructor(private http: HttpClient) {
    void this.reload();
  }

  async reload(): Promise<void> {
    const products = await firstValueFrom(this.http.get<Product[]>(this.apiUrl));
    this.productsSubject.next(products.map(product => this.prepareProduct(product)));
  }

  getAll(): Observable<Product[]> {
    return this.productsSubject.asObservable();
  }

  getFilteredProducts(filter: ProductFilter): Observable<Product[]> {
    return this.getAll().pipe(
      map(products => products.filter(product => {
        const search = filter.search?.trim().toLowerCase() || '';

        const matchSearch =
          !search ||
          product.name.toLowerCase().includes(search) ||
          product.description.toLowerCase().includes(search);

        const matchCategory =
          !filter.categoryName || product.categoryName === filter.categoryName;

        const matchMin =
          filter.minPrice == null || product.price >= filter.minPrice;

        const matchMax =
          filter.maxPrice == null || product.price <= filter.maxPrice;

        const matchAvailable =
          filter.available == null || product.available === filter.available;

        const matchPromotion =
          filter.promotion == null || product.promotion === filter.promotion;

        return matchSearch && matchCategory && matchMin && matchMax && matchAvailable && matchPromotion;
      }))
    );
  }

  getStockIssues(items: Array<{ productId: string; productName: string; quantity: number }>): string[] {
    const products = this.productsSubject.value;

    return items
      .map(item => {
        const product = products.find(productItem => productItem.id === String(item.productId));

        if (!product) {
          return `${item.productName} : produit introuvable`;
        }

        if (!product.available || product.stock < item.quantity) {
          return `${product.name} : stock disponible ${product.stock}`;
        }

        return '';
      })
      .filter(message => message.length > 0);
  }

  async add(product: Product): Promise<void> {
    const newProduct = this.prepareProduct({
      ...product,
      available: product.stock > 0,
      createdAt: product.createdAt || new Date().toISOString()
    });

    delete newProduct.id;

    const { createdAt: _createdAt, ...payload } = newProduct;
    const savedProduct = await firstValueFrom(this.http.post<Product>(this.apiUrl, payload));
    this.productsSubject.next([
      ...this.productsSubject.value,
      this.prepareProduct(savedProduct)
    ]);
  }

  async update(id: string, product: Partial<Product>): Promise<void> {
    const currentProduct = this.productsSubject.value.find(p => p.id === id);

    if (!currentProduct) {
      return;
    }

    const updatedProduct = this.prepareProduct({
      ...currentProduct,
      ...product,
      id,
      available: product.stock == null ? currentProduct.available : product.stock > 0
    });

    const { id: _productId, createdAt: _createdAt, ...payload } = updatedProduct;
    const savedProduct = await firstValueFrom(this.http.put<Product>(`${this.apiUrl}/${id}`, payload));
    const normalizedProduct = this.prepareProduct(savedProduct);

    this.productsSubject.next(
      this.productsSubject.value.map(item => item.id === id ? normalizedProduct : item)
    );
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
    this.productsSubject.next(this.productsSubject.value.filter(product => product.id !== id));
  }

  private prepareProduct(product: Product): Product {
    const imagePath = product.imagesUri || product.image || 'assets/images/placeholder.svg';

    return {
      ...product,
      id: product.id == null ? undefined : String(product.id),
      categoryId: String(product.categoryId),
      price: Number(product.price) || 0,
      stock: Number(product.stock) || 0,
      available: product.stock > 0 && product.available !== false,
      image: imagePath,
      imagesUri: imagePath,
      currency: 'TND'
    };
  }
}
