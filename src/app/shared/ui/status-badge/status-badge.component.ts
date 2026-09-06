import { Component, input } from '@angular/core';
import { TagModule } from 'primeng/tag';

@Component({
  imports: [TagModule],
  selector: 'app-status-badge',
  templateUrl: './status-badge.component.html',
})
export class StatusBadgeComponent {
  readonly status = input.required<string>();
}
