import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductFilterComponent } from './product-filter.component';
import { configureComponentTestBed } from '../../testing/component-test-bed';

describe('ProductFilterComponent', () => {
  let component: ProductFilterComponent;
  let fixture: ComponentFixture<ProductFilterComponent>;

  beforeEach(() => {
    configureComponentTestBed(ProductFilterComponent);
    fixture = TestBed.createComponent(ProductFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
