import { Injectable } from '@angular/core';
import { IdentityProvider } from './identity-provider-service';
import { UserAccount } from '../models/user-account.model';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MockIdentityProvider implements IdentityProvider {

  constructor() { }

  getAccount(): Observable<UserAccount>{
    return of(new UserAccount('SuperAdmin', 'superadmin@bayer.com'))
  }

  loginInProgress(): boolean {
    return false;
  }

  get isLoggedIn$(): Observable<boolean> {
    return of(true);
  }

  login(): void { }

  logout(): void { }
}
