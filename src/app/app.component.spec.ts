import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { configureComponentTestBed } from './testing/component-test-bed';

describe('AppComponent', () => {
  beforeEach(() => configureComponentTestBed(AppComponent));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'fashion-store'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('fashion-store');
  });

  it('should render the main content outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('main router-outlet')).not.toBeNull();
  });
});
