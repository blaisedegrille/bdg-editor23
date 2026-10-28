import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/core/auth.service';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [NgIf]
})
export class DashboardComponent implements OnInit {
  constructor(public authService: AuthService) {}
  ngOnInit(): void {}
}
