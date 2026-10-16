import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface UploadResponse {
  imagePath: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  private uploadUrl = 'http://localhost:3001/api/upload';

  constructor(private http: HttpClient) {}

  async uploadProductImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await firstValueFrom(
      this.http.post<UploadResponse>(this.uploadUrl, formData)
    );

    return response.imagePath;
  }
}
