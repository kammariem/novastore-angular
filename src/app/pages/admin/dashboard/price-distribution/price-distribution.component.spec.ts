import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PriceDistributionComponent } from './price-distribution.component';
import { configureComponentTestBed } from '../../../../testing/component-test-bed';

describe('PriceDistributionComponent', () => {
  let component: PriceDistributionComponent;
  let fixture: ComponentFixture<PriceDistributionComponent>;

  beforeEach(() => {
    configureComponentTestBed(PriceDistributionComponent);
    fixture = TestBed.createComponent(PriceDistributionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
