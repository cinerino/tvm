import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BaseComponent } from '../shared/components/pages/base/base.component';
import { CongestionComponent } from './components/pages/congestion/congestion.component';
import { ErrorComponent } from './components/pages/error/error.component';
import { ExpiredComponent } from './components/pages/expired/expired.component';
import { MaintenanceComponent } from './components/pages/maintenance/maintenance.component';
import { NotfoundComponent } from './components/pages/notfound/notfound.component';
import { StopComponent } from './components/pages/stop/stop.component';


const routes: Routes = [{
  path: '',
  component: BaseComponent,
  children: [
    { path: 'error', component: ErrorComponent },
    { path: 'expired', component: ExpiredComponent },
    { path: 'maintenance', component: MaintenanceComponent },
    { path: 'congestion', component: CongestionComponent },
    { path: 'stop', component: StopComponent },
    { path: '**', component: NotfoundComponent }
  ]
}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ErrorRoutingModule { }
