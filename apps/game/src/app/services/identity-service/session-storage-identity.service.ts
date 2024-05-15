import {IdentityService} from './identity.service';

export class SessionStorageIdentityService extends IdentityService {
  public async getIdentity(): Promise<string> {
    return sessionStorage.getItem('identity') || '';
  }

  public async setIdentity(identity: string): Promise<void> {
    sessionStorage.setItem('identity', identity);
  }

  public async clearIdentity(): Promise<void> {
    sessionStorage.removeItem('identity');
  }
}
