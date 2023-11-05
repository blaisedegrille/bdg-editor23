import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EditorService {
  data: any;

  constructor() {}

  saveData(data: any) {
    this.data = data;
  }
}
