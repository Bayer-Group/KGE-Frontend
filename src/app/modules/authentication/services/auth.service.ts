import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { IdentityProvider } from './identity-provider-service';
import { Injectable, Inject } from '@angular/core';
import { UserAccount } from '../models/user-account.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(@Inject('IdentityProvider') private identityProvider: IdentityProvider, private router: Router) { }

  get currentIdentity$(): Observable<UserAccount> {
    return this.identityProvider.getAccount();
  }

  get currentEmail$(): Observable<string> {
    return this.currentIdentity$.pipe(map(id => id ? id.email : null));
  }

  get currentName$(): Observable<string> {
    return this.currentIdentity$.pipe(map(id => id ? id.name : null));
  }

//   get currentUserId$(): Observable<string> {
//     return this.currentIdentity$.pipe(map(id => id ? id.accountIdentifier : null));
//   }

  get isLoggedIn$(): Observable<boolean> {
    return this.identityProvider.isLoggedIn$;
  }

  get loginInProgress(): boolean {
    return this.identityProvider.loginInProgress();
  }

//   get currentUserRoles$(): Observable<any> {
//     return this.currentIdentity$.pipe(map(id => id ? id.roles : []));
//   }

  get isLoadingUser(): boolean {
    return false;
  }

  get accessToken(): string {
    return localStorage.getItem('msal.idtoken')
  }

  redirect() {
    const redirectPathString = window.sessionStorage.getItem('url');
    const queryParamString = window.sessionStorage.getItem('queryParams');

    if (redirectPathString == null || queryParamString == null) {
      this.router.navigate(['']);
      return;
    }

    const redirectPath = JSON.parse(redirectPathString);
    const queryParams = JSON.parse(queryParamString);
    this.router.navigate(redirectPath, { queryParams: queryParams });
  }

  login() {
    try {
      this.identityProvider.login();
    }
    catch(error) {
      console.log("oh no, there's an error identityProvider", error);
    }
  }

  logout() {
    this.identityProvider.logout();
  }
}
