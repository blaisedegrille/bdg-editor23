import { Component, OnInit, inject } from '@angular/core';
import { EditorService } from 'src/app/service/editor.service';
import { MatButton, MatAnchor } from '@angular/material/button';
import { MatDivider } from '@angular/material/divider';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [MatButton, MatAnchor, MatDivider]
})
export class HomeComponent implements OnInit {
  editorService = inject(EditorService);

  ngOnInit(): void {
    console.log('home oninit: ', this.editorService.data);
    // this.editor = new EditorJS(config);
  }
}
