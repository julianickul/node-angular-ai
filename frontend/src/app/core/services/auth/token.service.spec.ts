import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { TokenService } from './token.service';

describe('TokenService', () => {
  let service: TokenService;
  let storage: Storage;

  beforeEach(() => {
    storage = (() => {
      const data = new Map<string, string>();
      return {
        get length() {
          return data.size;
        },
        clear: () => data.clear(),
        getItem: (key: string) => data.get(key) ?? null,
        key: (index: number) => Array.from(data.keys())[index] ?? null,
        removeItem: (key: string) => {
          data.delete(key);
        },
        setItem: (key: string, value: string) => {
          data.set(key, value);
        },
      };
    })();

    TestBed.configureTestingModule({
      providers: [
        TokenService,
        {
          provide: DOCUMENT,
          useValue: {
            defaultView: { localStorage: storage },
          },
        },
      ],
    });

    service = TestBed.inject(TokenService);
  });

  it('stores and reads tokens', () => {
    service.setTokens('access', 'refresh');

    expect(service.getAccessToken()).toBe('access');
    expect(service.getRefreshToken()).toBe('refresh');
    expect(service.hasAccessToken()).toBe(true);
    expect(storage.getItem('access_token')).toBe('access');
  });

  it('clears tokens', () => {
    service.setTokens('access', 'refresh');
    service.clearTokens();

    expect(service.getAccessToken()).toBeNull();
    expect(service.getRefreshToken()).toBeNull();
    expect(service.hasAccessToken()).toBe(false);
  });

  it('updates only access token', () => {
    service.setTokens('access', 'refresh');
    service.updateAccessToken('access-2');

    expect(service.getAccessToken()).toBe('access-2');
    expect(service.getRefreshToken()).toBe('refresh');
  });
});
