import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesOverviewChartComponent } from './sales-overview-chart.component';
import { configureComponentTestBed } from '../../../../testing/component-test-bed';

describe('SalesOverviewChartComponent', () => {
  let component: SalesOverviewChartComponent;
  let fixture: ComponentFixture<SalesOverviewChartComponent>;

  beforeEach(() => {
    configureComponentTestBed(SalesOverviewChartComponent);
    fixture = TestBed.createComponent(SalesOverviewChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
