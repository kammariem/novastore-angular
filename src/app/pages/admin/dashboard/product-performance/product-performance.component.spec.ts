import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductPerformanceComponent } from './product-performance.component';
import { configureComponentTestBed } from '../../../../testing/component-test-bed';

describe('ProductPerformanceComponent', () => {
  let component: ProductPerformanceComponent;
  let fixture: ComponentFixture<ProductPerformanceComponent>;

  beforeEach(() => {
    configureComponentTestBed(ProductPerformanceComponent);
    fixture = TestBed.createComponent(ProductPerformanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
