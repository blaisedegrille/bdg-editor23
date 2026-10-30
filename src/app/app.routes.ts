import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';
import { ArticleListComponent } from './pages/article-list/article-list.component';
import { ArticleViewComponent } from './pages/article-view/article-view.component';
import { EditorComponent } from './pages/editor/editor.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { HomeComponent } from './pages/home/home.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { SignInComponent } from './pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/sign-up/sign-up.component';
import { VerifyEmailComponent } from './pages/verify-email/verify-email.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'editor', component: EditorComponent, canActivate: [authGuard] },
  { path: 'editor/:id', component: EditorComponent, canActivate: [authGuard] },
  {
    path: 'articles',
    component: ArticleListComponent,
    canActivate: [authGuard],
  },
  {
    path: 'articles/:id',
    component: ArticleViewComponent,
    canActivate: [authGuard],
  },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  {
    path: 'read',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/read-and-highlight/read-and-highlight.component').then(
        (module) => module.ReadAndHighlightComponent,
      ),
  },
  {
    path: 'read-text',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/read-text/read-text.component').then(
        (module) => module.ReadTextComponent,
      ),
  },
  { path: 'dashboard', redirectTo: 'profile' },
  { path: 'not-found', component: NotFoundComponent },
  { path: 'sign-in', component: SignInComponent },
  { path: 'register-user', component: SignUpComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'verify-email-address', component: VerifyEmailComponent },
  { path: '**', redirectTo: 'not-found' },
];
