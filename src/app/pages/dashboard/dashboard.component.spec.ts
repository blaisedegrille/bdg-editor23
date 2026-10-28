import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from 'src/app/core/auth.service';
import { authServiceStub } from 'src/app/testing/auth-service.stub';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, DashboardComponent],
      providers: [{ provide: AuthService, useValue: authServiceStub }],
    });
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the signed in user profile', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.dashboard__title')?.textContent).toContain(
      'Test User'
    );
    expect(compiled.querySelector('.dashboard__email')?.textContent).toContain(
      'test@example.com'
    );
    expect(compiled.querySelector('.dashboard__status')?.textContent).toContain(
      'Email verified'
    );
  });

  it('shows account details from the Firebase user', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Email and password');
    expect(compiled.textContent).toContain('Jan 15, 2024');
    expect(compiled.textContent).toContain('test-uid');
  });

  it('offers a sign out action', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.dashboard__signout')).toBeTruthy();
  });
});
