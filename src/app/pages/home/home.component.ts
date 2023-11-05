import { Component, OnInit, inject } from '@angular/core';
import * as EditorJS from '@editorjs/editorjs';
import { config } from 'rxjs';
import { EditorService } from 'src/app/service/editor.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  editorService = inject(EditorService);

  ngOnInit(): void {
    console.log('home oninit: ', this.editorService.data);
    // this.editor = new EditorJS(config);
  }
}
