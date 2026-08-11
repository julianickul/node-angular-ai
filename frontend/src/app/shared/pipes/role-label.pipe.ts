import { Pipe, PipeTransform } from '@angular/core';
import { UserRole } from '@nnaai/shared-types';
import { ROLE_LABELS } from '@shared/constants/user.constants';

@Pipe({ name: 'roleLabel', standalone: true })
export class RoleLabelPipe implements PipeTransform {
  transform(value: UserRole | null | undefined): string {
    return value ? ROLE_LABELS[value] : '—';
  }
}
