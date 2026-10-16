import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesTrendComponent } from './sales-trend.component';
import { configureComponentTestBed } from '../../../../testing/component-test-bed';

describe('SalesTrendComponent', () => {
  let component: SalesTrendComponent;
  let fixture: ComponentFixture<SalesTrendComponent>;

  beforeEach(() => {
    configureComponentTestBed(SalesTrendComponent);
    fixture = TestBed.createComponent(SalesTrendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
