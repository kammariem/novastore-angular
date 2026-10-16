import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'fashion-store';
  isAdminRoute = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.isAdminRoute = this.router.url.startsWith('/admin');

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(event => {
        const navigation = event as NavigationEnd;
        this.isAdminRoute = navigation.urlAfterRedirects.startsWith('/admin');
      });
  }
}
