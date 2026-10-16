import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryRevenueComponent } from './category-revenue.component';

describe('CategoryRevenueComponent', () => {
  let component: CategoryRevenueComponent;
  let fixture: ComponentFixture<CategoryRevenueComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CategoryRevenueComponent]
    });
    fixture = TestBed.createComponent(CategoryRevenueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
