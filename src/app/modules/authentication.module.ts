import { NgModule, ModuleWithProviders, Provider } from '@angular/core';
import { CommonModule } from '@angular/common';
import {AzureAuthenticationModule} from './azure-authentication.module';
import { AuthService } from './authentication/services/auth.service';
import { environment } from 'src/environments/environment';
import { MockAuthenticationModule } from './mock-authentication.module';

export const providers: Provider[] = [AuthService];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    environment.allowAnonymous ? MockAuthenticationModule.forRoot() : AzureAuthenticationModule.forRoot()
  ],
  providers: [providers],
  exports: [
    environment.allowAnonymous ? MockAuthenticationModule: AzureAuthenticationModule 
  ]
})
export class AuthenticationModule {
  static forRoot(): ModuleWithProviders<AuthenticationModule> {
    return {
      ngModule: AuthenticationModule,
      providers: [providers]
    };
  }
}