import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductPerformanceComponent } from './product-performance.component';

describe('ProductPerformanceComponent', () => {
  let component: ProductPerformanceComponent;
  let fixture: ComponentFixture<ProductPerformanceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProductPerformanceComponent]
    });
    fixture = TestBed.createComponent(ProductPerformanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
