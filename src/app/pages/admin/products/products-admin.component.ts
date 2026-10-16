import { Component, OnInit } from '@angular/core';
import { Product, ProductType } from '../../../models/product.model';
import { Category } from '../../../models/category.model';
import { ProductService } from '../../../services/product.service';
import { CategoryService } from '../../../services/category.service';
import { ImageUploadService } from '../../../services/image-upload.service';

@Component({
  selector: 'app-products-admin',
  templateUrl: './products-admin.component.html',
  styleUrls: ['./products-admin.component.css']
})
export class ProductsAdminComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];

  form: Product = this.getEmptyProduct();
  showModal = false;
  editingProductId: string | null = null;
  selectedImageFile: File | null = null;
  imagePreview = '';
  saving = false;
  errorMessage = '';

  productTypes: ProductType[] = [
    'T-Shirt',
    'Chemise',
    'Pantalon',
    'Robe',
    'Veste',
    'Pull',
    'Sac',
    'Chaussures'
  ];

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private imageUploadService: ImageUploadService
  ) {}

  ngOnInit(): void {
    this.productService.getAll().subscribe(products => this.products = products);
    this.categoryService.getAll().subscribe(categories => {
      this.categories = categories;

      if (!this.form.categoryId) {
        this.form = this.getEmptyProduct();
      }
    });
  }

  openAddModal(): void {
    this.editingProductId = null;
    this.form = this.getEmptyProduct();
    this.selectedImageFile = null;
    this.imagePreview = this.form.imagesUri || this.form.image;
    this.errorMessage = '';
    this.showModal = true;
  }

  openEditModal(product: Product): void {
    this.editingProductId = product.id || null;
    this.form = {
      ...product,
      categoryId: this.getCategoryFormValue(product.categoryId),
      image: product.imagesUri || product.image,
      imagesUri: product.imagesUri || product.image
    };
    this.selectedImageFile = null;
    this.imagePreview = this.form.imagesUri || this.form.image;
    this.errorMessage = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingProductId = null;
    this.form = this.getEmptyProduct();
    this.selectedImageFile = null;
    this.imagePreview = '';
    this.errorMessage = '';
    this.saving = false;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    this.errorMessage = '';
    this.selectedImageFile = file;

    if (!file) {
      this.imagePreview = this.form.imagesUri || this.form.image;
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.selectedImageFile = null;
      input.value = '';
      this.errorMessage = 'Veuillez sélectionner un fichier image valide.';
      return;
    }

    this.imagePreview = URL.createObjectURL(file);
  }

  async saveProduct(): Promise<void> {
    this.errorMessage = '';
    this.saving = true;

    try {
      this.prepareCategoryFields();

      if (this.selectedImageFile) {
        const imagePath = await this.imageUploadService.uploadProductImage(this.selectedImageFile);
        this.form.imagesUri = imagePath;
        this.form.image = imagePath;
      }

      if (this.editingProductId) {
        await this.productService.update(this.editingProductId, this.form);
        this.closeModal();
        return;
      }

      await this.productService.add(this.form);
      this.closeModal();
    } catch (error) {
      this.saving = false;
      this.errorMessage = 'Impossible d’enregistrer le produit. Vérifiez que le serveur upload et json-server sont lancés.';
    }
  }

  deleteProduct(product: Product): void {
    if (!product.id) {
      return;
    }

    if (confirm(`Supprimer le produit "${product.name}" ?`)) {
      void this.productService.delete(product.id);
    }
  }

  getProductImage(product: Product): string {
    return product.imagesUri || product.image || 'assets/images/placeholder.svg';
  }

  trackByProductId(index: number, product: Product): string {
    return product.id || index.toString();
  }

  private prepareCategoryFields(): void {
    const category = this.categories.find(item =>
      item.slug === this.form.categoryId || String(item.id) === String(this.form.categoryId)
    );

    if (category) {
      this.form.categoryId = category.slug;
      this.form.categoryName = category.name;
    }

    this.form.stock = Number(this.form.stock) || 0;
    this.form.price = Number(this.form.price) || 0;
    this.form.available = this.form.stock > 0;
    this.form.imagesUri = this.form.imagesUri || this.form.image || 'assets/images/placeholder.svg';
    this.form.image = this.form.imagesUri;
  }

  private getEmptyProduct(): Product {
    const firstCategory = this.categories.find(category => category.active) || this.categories[0];

    return {
      name: '',
      description: '',
      price: 0,
      currency: 'TND',
      categoryId: firstCategory?.slug || 'femmes',
      categoryName: firstCategory?.name || 'Femmes',
      type: 'Robe',
      image: 'assets/images/placeholder.svg',
      imagesUri: 'assets/images/placeholder.svg',
      stock: 0,
      available: true,
      promotion: false
    };
  }

  private getCategoryFormValue(categoryId: string): string {
    const category = this.categories.find(item =>
      item.slug === categoryId || String(item.id) === String(categoryId)
    );

    return category?.slug || categoryId;
  }
}
