import { Component, OnInit } from '@angular/core';
import { ClientProfile } from '../../../models/client.model';
import { ClientService } from '../../../services/client.service';
import { OrderService } from '../../../services/order.service';

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

  constructor(
    private clientService: ClientService,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    this.orderService.getAll().subscribe(orders => this.clientService.syncFromOrders(orders));
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

    this.clientService.update(this.editingClientId, this.form).then(() => this.closeModal());
  }

  deleteClient(client: ClientProfile): void {
    if (confirm(`Supprimer le client "${client.name}" ?`)) {
      this.clientService.delete(client.id);
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
