import { Component, OnInit } from '@angular/core';
import { Category } from '../../../models/category.model';
import { CategoryService } from '../../../services/category.service';

@Component({
  selector: 'app-categories-admin',
  templateUrl: './categories-admin.component.html',
  styleUrls: ['./categories-admin.component.css']
})
export class CategoriesAdminComponent implements OnInit {
  categories: Category[] = [];
  form: Category = this.getEmptyCategory();
  showModal = false;
  editingCategoryId: string | null = null;
  errorMessage = '';

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.categoryService.getAll().subscribe(categories => this.categories = categories);
  }

  openAddModal(): void {
    this.editingCategoryId = null;
    this.form = this.getEmptyCategory();
    this.errorMessage = '';
    this.showModal = true;
  }

  openEditModal(category: Category): void {
    this.editingCategoryId = category.id || null;
    this.form = { ...category };
    this.errorMessage = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingCategoryId = null;
    this.form = this.getEmptyCategory();
    this.errorMessage = '';
  }

  async saveCategory(): Promise<void> {
    this.errorMessage = '';
    if (!this.form.slug) {
      this.form.slug = this.slugify(this.form.name);
    }

    try {
      if (this.editingCategoryId) {
        await this.categoryService.update(this.editingCategoryId, this.form);
      } else {
        await this.categoryService.add(this.form);
      }
      this.closeModal();
    } catch {
      this.errorMessage = 'Impossible d’enregistrer la catégorie. Vérifiez le nom et le slug.';
    }
  }

  async deleteCategory(category: Category): Promise<void> {
    if (!category.id) {
      return;
    }

    if (confirm(`Supprimer la catégorie "${category.name}" ?`)) {
      try {
        await this.categoryService.delete(category.id);
      } catch {
        this.errorMessage = 'Impossible de supprimer cette catégorie. Vérifiez qu’elle ne contient aucun produit.';
      }
    }
  }

  trackByCategoryId(index: number, category: Category): string {
    return category.id || index.toString();
  }

  private getEmptyCategory(): Category {
    return {
      name: '',
      slug: '',
      description: '',
      image: 'assets/images/placeholder.svg',
      active: true
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
