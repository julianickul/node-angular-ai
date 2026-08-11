import { UserRole } from '@nnaai/shared-types';
import { RoleLabelPipe } from './role-label.pipe';

describe('RoleLabelPipe', () => {
  const pipe = new RoleLabelPipe();

  it('maps role to label', () => {
    expect(pipe.transform(UserRole.ADMIN)).toBe('Администратор');
  });

  it('returns dash for empty value', () => {
    expect(pipe.transform(null)).toBe('—');
    expect(pipe.transform(undefined)).toBe('—');
  });
});
