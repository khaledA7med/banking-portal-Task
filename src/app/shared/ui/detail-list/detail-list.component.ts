import { Component, input } from '@angular/core';
import { NationalIdMaskPipe } from '../../pipes/national-id-mask.pipe';

export interface DetailListItem {
  label: string;
  mask?: 'nationalId';
  value: string | number;
}

@Component({
  imports: [NationalIdMaskPipe],
  selector: 'app-detail-list',
  templateUrl: './detail-list.component.html',
})
export class DetailListComponent {
  readonly items = input.required<DetailListItem[]>();
  readonly variant = input<'default' | 'profile'>('default');
}
