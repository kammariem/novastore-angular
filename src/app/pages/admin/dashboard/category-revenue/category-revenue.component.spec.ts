import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CategoryRevenueComponent } from './category-revenue.component';
import { configureComponentTestBed } from '../../../../testing/component-test-bed';

describe('CategoryRevenueComponent', () => {
  let component: CategoryRevenueComponent;
  let fixture: ComponentFixture<CategoryRevenueComponent>;

  beforeEach(() => {
    configureComponentTestBed(CategoryRevenueComponent);
    fixture = TestBed.createComponent(CategoryRevenueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
