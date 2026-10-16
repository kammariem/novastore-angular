import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ClientService } from '../../services/client.service';

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
    private clientService: ClientService,
    private router: Router
  ) {}

  login(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.login(this.email.trim(), this.password)
      .then(result => {
        this.loading = false;

        const email = result.user.email;

        if (this.authService.isAdminEmail(email)) {
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

    if (this.registerPassword.length < 6) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 6 caractères.';
      return;
    }

    if (this.authService.isAdminEmail(this.registerEmail)) {
      this.errorMessage = 'Cet email est réservé à l’administrateur.';
      return;
    }

    this.loading = true;

    this.authService.registerClient(
      this.registerEmail.trim(),
      this.registerPassword,
      this.registerName.trim()
    )
      .then(result => {
        return this.clientService.add({
          id: result.user.uid,
          name: this.registerName.trim(),
          email: this.registerEmail.trim(),
          phone: this.registerPhone.trim(),
          address: this.registerAddress.trim(),
          active: true,
          createdAt: new Date().toISOString()
        });
      })
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
    if (code === 'auth/email-already-in-use') {
      return 'Un compte existe déjà avec cet email.';
    }

    if (code === 'auth/invalid-email') {
      return 'Adresse email invalide.';
    }

    if (code === 'auth/weak-password') {
      return 'Le mot de passe est trop faible.';
    }

    return 'Impossible de créer le compte. Vérifiez les informations puis réessayez.';
  }
}
