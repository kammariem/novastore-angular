import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ProductFilter } from '../../models/filter.model';

@Component({
  selector: 'app-product-filter',
  templateUrl: './product-filter.component.html',
  styleUrls: ['./product-filter.component.css']
})
export class ProductFilterComponent implements OnChanges {
  @Input() categoryNameFilter: string | null = null;
  @Output() filterChange = new EventEmitter<ProductFilter>();

  filter: ProductFilter = {
    search: '',
    categoryName: '',
    minPrice: undefined,
    maxPrice: undefined,
    available: null,
    promotion: null
  };

  categories = ['Femmes', 'Hommes', 'Enfants', 'Chaussures', 'Accessoires', 'Promotions'];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoryNameFilter']) {
      this.filter.categoryName = this.categoryNameFilter || '';
      this.apply();
    }
  }

  apply(): void {
    this.filterChange.emit(this.filter);
  }

  reset(): void {
    this.filter = {
      search: '',
      categoryName: '',
      minPrice: undefined,
      maxPrice: undefined,
      available: null,
      promotion: null
    };
    this.apply();
  }
}
