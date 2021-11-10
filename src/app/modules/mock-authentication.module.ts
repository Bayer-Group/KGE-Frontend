import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';

// Msal
import { MockIdentityProvider } from './authentication/services/mock-identity-provider.service';


@NgModule({
  imports: [
    CommonModule,
  ],
  providers: [
    { provide: "IdentityProvider", useClass: MockIdentityProvider }
  ]
})
export class MockAuthenticationModule {
  static forRoot(): ModuleWithProviders<MockAuthenticationModule> {
    return {
      ngModule: MockAuthenticationModule,
      providers: [
        { provide: "IdentityProvider", useClass: MockIdentityProvider }
      ]
    };
  }
}