import { Injectable } from '@angular/core';
import { Category } from '../models/category.model';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class SeedDataService {
  categories: Category[] = [
    { name: 'Femmes', slug: 'femmes', active: true },
    { name: 'Hommes', slug: 'hommes', active: true },
    { name: 'Enfants', slug: 'enfants', active: true },
    { name: 'Chaussures', slug: 'chaussures', active: true },
    { name: 'Accessoires', slug: 'accessoires', active: true },
    { name: 'Promotions', slug: 'promotions', active: true }
  ];

  products: Product[] = [
    {
      name: 'Robe élégante beige',
      description: 'Robe simple et chic adaptée aux sorties et aux occasions.',
      price: 89,
      currency: 'TND',
      categoryId: 'femmes',
      categoryName: 'Femmes',
      type: 'Robe',
      image: 'assets/images/robe-beige.jpg',
      stock: 12,
      available: true,
      promotion: false
    },
    {
      name: 'Chemise blanche femme',
      description: 'Chemise classique blanche, confortable et facile à porter.',
      price: 55,
      currency: 'TND',
      categoryId: 'femmes',
      categoryName: 'Femmes',
      type: 'Chemise',
      image: 'assets/images/chemise-femme.jpg',
      stock: 20,
      available: true,
      promotion: false
    },
    {
      name: 'Sac à main noir',
      description: 'Sac moderne noir avec design simple et élégant.',
      price: 75,
      currency: 'TND',
      categoryId: 'accessoires',
      categoryName: 'Accessoires',
      type: 'Sac',
      image: 'assets/images/sac-noir.jpg',
      stock: 8,
      available: true,
      promotion: true
    },
    {
      name: 'T-shirt homme basic',
      description: 'T-shirt confortable pour homme, style simple et quotidien.',
      price: 35,
      currency: 'TND',
      categoryId: 'hommes',
      categoryName: 'Hommes',
      type: 'T-Shirt',
      image: 'assets/images/tshirt-homme.jpg',
      stock: 30,
      available: true,
      promotion: false
    }
  ];
}
