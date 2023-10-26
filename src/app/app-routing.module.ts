import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditorComponent } from './pages/editor/editor.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { HomeComponent } from './pages/home/home.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'not-found', component: NotFoundComponent },
  { path: 'editor', component: EditorComponent },
  /*   { path: 'dynamic-grid', component: DynamicGridComponent },
  { path: 'editor', component: EditorComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'maintenance', component: MaintenanceComponent },
  { path: 'datatable', component: DataTableComponent },
  { path: 'user', component: UserComponent },
  { path: 'settings', component: SettingsComponent }, */
  { path: '**', redirectTo: 'not-found' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
