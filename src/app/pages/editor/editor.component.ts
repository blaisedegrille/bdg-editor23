import { Component, OnInit, ViewChild, inject } from '@angular/core';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import { EditorService } from 'src/app/service/editor.service';

const config = {
  holder: 'editorjs',
  // inlineToolbar: ['link', 'marker', 'bold', 'italic'],
  // inlineToolbar: true,
  autofocus: true,
  placeholder: 'Let`s write an awesome story!',
  tools: {
    header: Header,
    // list: List,
  },
  onReady: () => {
    console.log('Editor.js is ready to work!');
  },
  onChange: (api: any, event: any) => {
    console.log("Now I know that Editor's content changed!", event);
  },
};

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.scss'],
})
export class EditorComponent implements OnInit {
  // @ViewChild(EditorJS)
  editor!: EditorJS; // = new EditorJS(config);

  editorService = inject(EditorService);

  ngOnInit(): void {
    this.editor = new EditorJS(config);
  }

  onSave() {
    // console.log('this.editor: ', this.editor);
    const data = this.editor
      .save()
      .then((outputData: any) => {
        this.editorService.saveData(outputData);
        console.log('Article data: ', outputData);
      })
      .catch((error: any) => {
        console.log('Saving failed: ', error);
      });
    // console.log('SAVED DATA: ', data);
  }

  onRefresh() {
    this.editor.readOnly.toggle(); // = true;
    this.editor.render(this.editorService.data);
  }

  onClear() {
    this.editor.clear();
  }
}
