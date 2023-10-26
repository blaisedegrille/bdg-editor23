import {NgModule} from '@angular/core';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {AngularFireModule} from '@angular/fire/compat';
import {AngularFireDatabase, AngularFireDatabaseModule} from '@angular/fire/compat/database';
import {AngularFirestoreModule} from '@angular/fire/compat/firestore';
import {AngularFireStorageModule} from '@angular/fire/compat/storage';
import {MaterialModule} from "./material.module";
import firebase from "firebase/compat";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyALyyypNrGwGCH3R_c3GUBzIWnEwR1mXXE',
  authDomain: 'bdg-editor.firebaseapp.com',
  projectId: 'bdg-editor',
  storageBucket: 'bdg-editor.appspot.com',
  messagingSenderId: '456818769012',
  appId: '1:456818769012:web:7247b16a63f7677f506521',
  measurementId: 'G-RVBHV19XKQ',
};

@NgModule({
  declarations: [AppComponent],
  imports: [AppRoutingModule, BrowserAnimationsModule,
    MaterialModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireDatabaseModule,
    AngularFirestoreModule,
    AngularFireStorageModule
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {
  // !!!! lesz egy hiba az egyik libben, amit interneten is írnak, hogy még
  // nincs kijavítva - ezt megoldottam így:
  // manuálisan módosítsd a filet:
  // node_modules/@angular/fire/compat/database/interfaces.d.ts
  // régi: extends firebase.database.DataSnapshot
  // új: extends firebase.database.IteratedDataSnapshot

  constructor(private db: AngularFireDatabase) {
    console.log(db.database);
    db.list('/foo');
    // const tutorials = db.list('tutorials').valueChanges();
    // tutorials.forEach((value) => console.log(value)).then();
  }
}
