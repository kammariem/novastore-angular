import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalesTrendComponent } from './sales-trend.component';

describe('SalesTrendComponent', () => {
  let component: SalesTrendComponent;
  let fixture: ComponentFixture<SalesTrendComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SalesTrendComponent]
    });
    fixture = TestBed.createComponent(SalesTrendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
