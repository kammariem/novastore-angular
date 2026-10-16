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

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.categoryService.getAll().subscribe(categories => this.categories = categories);
  }

  openAddModal(): void {
    this.editingCategoryId = null;
    this.form = this.getEmptyCategory();
    this.showModal = true;
  }

  openEditModal(category: Category): void {
    this.editingCategoryId = category.id || null;
    this.form = { ...category };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingCategoryId = null;
    this.form = this.getEmptyCategory();
  }

  saveCategory(): void {
    if (!this.form.slug) {
      this.form.slug = this.slugify(this.form.name);
    }

    if (this.editingCategoryId) {
      this.categoryService.update(this.editingCategoryId, this.form).then(() => this.closeModal());
      return;
    }

    this.categoryService.add(this.form).then(() => this.closeModal());
  }

  deleteCategory(category: Category): void {
    if (!category.id) {
      return;
    }

    if (confirm(`Supprimer la catégorie "${category.name}" ?`)) {
      this.categoryService.delete(category.id);
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
      image: 'assets/images/placeholder.jpg',
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
