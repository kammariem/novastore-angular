import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  mode: 'login' | 'register' = 'login';

  email = '';
  password = '';

  registerName = '';
  registerEmail = '';
  registerPhone = '';
  registerAddress = '';
  registerPassword = '';

  errorMessage = '';
  successMessage = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  login(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.login(this.email.trim(), this.password)
      .then(result => {
        this.loading = false;

        if (result.user.role === 'admin') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/products']);
        }
      })
      .catch(() => {
        this.loading = false;
        this.errorMessage = 'Email ou mot de passe incorrect.';
      });
  }

  registerClient(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.registerName.trim() || !this.registerEmail.trim() || !this.registerPassword) {
      this.errorMessage = 'Veuillez remplir le nom, l’email et le mot de passe.';
      return;
    }

    if (this.registerPassword.length < 12) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 12 caractères.';
      return;
    }

    this.loading = true;

    this.authService.registerClient(
      this.registerEmail.trim(),
      this.registerPassword,
      this.registerName.trim(),
      this.registerPhone.trim(),
      this.registerAddress.trim()
    )
      .then(() => {
        this.loading = false;
        this.successMessage = 'Compte client créé avec succès.';
        this.router.navigate(['/products']);
      })
      .catch(error => {
        this.loading = false;
        this.errorMessage = this.getRegisterErrorMessage(error?.code);
      });
  }

  showRegister(): void {
    this.mode = 'register';
    this.errorMessage = '';
    this.successMessage = '';
  }

  showLogin(): void {
    this.mode = 'login';
    this.errorMessage = '';
    this.successMessage = '';
  }

  private getRegisterErrorMessage(code: string | undefined): string {
    return 'Impossible de créer le compte. Vérifiez les informations puis réessayez.';
  }
}
