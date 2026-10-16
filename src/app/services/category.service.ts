import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private apiUrl = 'http://localhost:3000/categories';
  private categoriesSubject = new BehaviorSubject<Category[]>([]);

  constructor(private http: HttpClient) {
    void this.reload();
  }

  getAll(): Observable<Category[]> {
    return this.categoriesSubject.asObservable();
  }

  async reload(): Promise<void> {
    const categories = await firstValueFrom(this.http.get<Category[]>(this.apiUrl));
    this.categoriesSubject.next(categories.map(category => this.prepareCategory(category)));
  }

  async add(category: Category): Promise<void> {
    const cleanCategory = this.prepareCategory(category);
    const savedCategory = await firstValueFrom(this.http.post<Category>(this.apiUrl, cleanCategory));
    this.categoriesSubject.next([
      ...this.categoriesSubject.value,
      this.prepareCategory(savedCategory)
    ]);
  }

  async update(id: string, category: Partial<Category>): Promise<void> {
    const currentCategory = this.categoriesSubject.value.find(item => item.id === id);

    if (!currentCategory) {
      return;
    }

    const updatedCategory = this.prepareCategory({
      ...currentCategory,
      ...category
    });

    const savedCategory = await firstValueFrom(this.http.put<Category>(`${this.apiUrl}/${id}`, updatedCategory));

    this.categoriesSubject.next(
      this.categoriesSubject.value.map(item => item.id === id ? this.prepareCategory(savedCategory) : item)
    );
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${this.apiUrl}/${id}`));
    this.categoriesSubject.next(this.categoriesSubject.value.filter(category => category.id !== id));
  }

  private prepareCategory(category: Category): Category {
    const slug = this.slugify(category.slug || category.name);

    return {
      ...category,
      id: category.id == null ? slug || Date.now().toString() : String(category.id),
      slug,
      description: category.description || '',
      image: category.image || 'assets/images/placeholder.png',
      active: category.active !== false
    };
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
