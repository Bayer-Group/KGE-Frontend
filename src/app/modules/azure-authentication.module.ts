import { NgModule, ModuleWithProviders, Provider } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from 'src/environments/environment';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AzureIdentityProvider } from './authentication/services/azure-identity-provider.service';
import { Configuration } from 'msal';
import { MsalModule, MsalInterceptor ,
  MsalService,
  MsalAngularConfiguration,
  MSAL_CONFIG,
  MSAL_CONFIG_ANGULAR } from '@azure/msal-angular';
import { _fixedSizeVirtualScrollStrategyFactory } from '@angular/cdk/scrolling';


export const isIE = window.navigator.userAgent.indexOf('MSIE ') > -1 || window.navigator.userAgent.indexOf('Trident/') > -1;


export function MSALConfigFactory(): Configuration {
  return {
    auth: {
      authority: environment.adalConfig.authority,
      clientId: environment.adalConfig.clientId,
      redirectUri: environment.adalConfig.redirectUri,
      validateAuthority: true,
      postLogoutRedirectUri: environment.adalConfig.postLogoutRedirectUri,
      navigateToLoginRequestUrl: true,
    },
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: isIE, // set to true for IE 11
    },
  };
}

export function MSALAngularConfigFactory(): MsalAngularConfiguration {
  return {
    popUp: !isIE,
    consentScopes: ["openid", "profile", "email"],
    protectedResourceMap: new Map(Object.entries(environment.adalConfig.protectedResourceMap)),
    unprotectedResources: [],
    extraQueryParameters: {}
  };
}

const providers: Provider[] = [
  MsalService,
  {
    provide: 'IdentityProvider',
    useClass: AzureIdentityProvider
  },
  {
    provide: MSAL_CONFIG,
    useFactory: MSALConfigFactory
  },
  {
    provide: MSAL_CONFIG_ANGULAR,
    useFactory: MSALAngularConfigFactory
  },
  {
    provide: HTTP_INTERCEPTORS,
    useClass: MsalInterceptor, multi: true
  }
]

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MsalModule
  ],
  providers : providers,
  exports: [
    MsalModule
  ]
})
export class AzureAuthenticationModule {
  static forRoot(): ModuleWithProviders<AzureAuthenticationModule> {
    return {
      ngModule: AzureAuthenticationModule,
      providers: providers
    };
  }
}
