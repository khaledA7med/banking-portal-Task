import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'nationalIdMask',
})
export class NationalIdMaskPipe implements PipeTransform {
  transform(value: string): string {
    if (value.length <= 4) {
      return value;
    }

    return `${'*'.repeat(value.length - 4)}${value.slice(-4)}`;
  }
}
