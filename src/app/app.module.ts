import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EditorComponent } from './pages/editor/editor.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { HomeComponent } from './pages/home/home.component';
import { ModeToggleModule } from './shared/mode-toggle/mode-toggle.module';
import { ArticleListComponent } from './pages/article-list/article-list.component';
import { ArticleComponent } from './pages/article-list/article/article.component';
import { MaterialModule } from './shared/material.module';

import { SignInComponent } from './pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/sign-up/sign-up.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { VerifyEmailComponent } from './pages/verify-email/verify-email.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

@NgModule({
  declarations: [
    AppComponent,
    EditorComponent,
    NotFoundComponent,
    HomeComponent,
    ArticleListComponent,
    ArticleComponent,
    SignInComponent,
    SignUpComponent,
    ForgotPasswordComponent,
    VerifyEmailComponent,
    DashboardComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    ModeToggleModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
