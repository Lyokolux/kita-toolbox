import { Component } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-navbar',
  styleUrl: './navbar.css',
  templateUrl: './navbar.html',
})
export class Navbar {
  onClick() {
    const el = document.querySelector('#collapsible1') as HTMLInputElement;
    el.checked = !el.checked;
  }
}
