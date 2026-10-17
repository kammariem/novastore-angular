import { Component, OnInit } from '@angular/core';
import { ClientProfile } from '../../../models/client.model';
import { ClientService } from '../../../services/client.service';

@Component({
  selector: 'app-clients-admin',
  templateUrl: './clients-admin.component.html',
  styleUrls: ['./clients-admin.component.css']
})
export class ClientsAdminComponent implements OnInit {
  clients: ClientProfile[] = [];
  form: ClientProfile = this.getEmptyClient();
  showModal = false;
  editingClientId: string | null = null;
  errorMessage = '';

  constructor(
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.clientService.getAll().subscribe(clients => this.clients = clients);
  }

  openEditModal(client: ClientProfile): void {
    this.editingClientId = client.id;
    this.form = { ...client };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingClientId = null;
    this.form = this.getEmptyClient();
  }

  saveClient(): void {
    if (!this.editingClientId) {
      return;
    }

    this.errorMessage = '';
    this.clientService.update(this.editingClientId, this.form)
      .then(() => this.closeModal())
      .catch(() => this.errorMessage = 'Impossible de mettre à jour le compte client.');
  }

  async deleteClient(client: ClientProfile): Promise<void> {
    if (confirm(`Désactiver le compte de "${client.name}" ?`)) {
      this.errorMessage = '';
      try {
        await this.clientService.delete(client.id);
      } catch {
        this.errorMessage = 'Impossible de désactiver le compte client.';
      }
    }
  }

  trackByClientId(index: number, client: ClientProfile): string {
    return client.id || index.toString();
  }

  private getEmptyClient(): ClientProfile {
    return {
      id: '',
      name: '',
      email: '',
      phone: '',
      address: '',
      active: true,
      createdAt: new Date().toISOString()
    };
  }
}
