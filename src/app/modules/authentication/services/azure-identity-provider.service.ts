import { Injectable, Inject } from '@angular/core';
import { IdentityProvider } from './identity-provider-service';
import { MsalService, BroadcastService } from '@azure/msal-angular';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { map } from 'rxjs/operators';
import {UserAccount} from '../models/user-account.model'

@Injectable({
  providedIn: 'root'
})
export class AzureIdentityProvider implements IdentityProvider {

  isLoggedIn$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(@Inject(MsalService) private msalService: MsalService, private broadcastService: BroadcastService) {
    this.isLoggedIn$.next(this.checkLoggedIn());
    
    this.broadcastService.subscribe('msal:loginSuccess', res => {
      this.isLoggedIn$.next(this.checkLoggedIn());
    });

    this.broadcastService.subscribe('msal:acquireTokenFailure', res => {
      const loggedIn = this.checkLoggedIn();

      this.isLoggedIn$.next(loggedIn);
      if (!loggedIn) {

        this.login();
      }
    });
  }

  checkLoggedIn(): boolean {
    return this.msalService.getAccount() != null && +(this.msalService.getAccount().idToken).exp > new Date().getSeconds()
  }

  getAccount(): Observable<UserAccount> { 
    return this.isLoggedIn$.pipe(map(isLoggedIn => {
      const azureAccount = this.msalService.getAccount();
      if (!isLoggedIn) {
        return null;
      } else {
        return new UserAccount(azureAccount.name, azureAccount.userName)
      }
    }))
  }

  loginInProgress(): boolean {
    return this.msalService.getLoginInProgress();
  }

  login(): void {
    try {
      this.msalService.loginRedirect();
    }
    catch(error) {
      console.log("msalService, there's an error", error);
    }
  }

  logout(): void {
    this.msalService.logout();
  }
}
