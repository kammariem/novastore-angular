import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductCardComponent } from './product-card.component';
import { configureComponentTestBed } from '../../testing/component-test-bed';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  beforeEach(() => {
    configureComponentTestBed(ProductCardComponent);
    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    component.product = {
      name: 'Produit de test',
      description: 'Description de test',
      price: 10,
      currency: 'TND',
      categoryId: 'test',
      categoryName: 'Test',
      type: 'Robe',
      image: 'assets/images/placeholder.svg',
      stock: 1,
      available: true,
      promotion: false
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
