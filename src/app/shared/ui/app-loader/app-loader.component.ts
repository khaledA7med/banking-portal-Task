import { Component, inject } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { LoaderService } from '../../../core/loader/loader.service';

@Component({
  imports: [ProgressSpinnerModule],
  selector: 'app-loader',
  templateUrl: './app-loader.component.html',
})
export class AppLoaderComponent {
  protected readonly loaderService = inject(LoaderService);
}
