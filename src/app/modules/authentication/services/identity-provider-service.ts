import { UserAccount } from '../models/user-account.model';
import { Observable } from 'rxjs';

export interface IdentityProvider {
  getAccount(): Observable<UserAccount>;
  loginInProgress(): boolean;
  isLoggedIn$: Observable<boolean>;
  login(): void;
  logout(): void;
}

