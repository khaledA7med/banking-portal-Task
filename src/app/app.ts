import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppLoaderComponent } from './shared';

@Component({
  imports: [AppLoaderComponent, RouterOutlet],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {
}
