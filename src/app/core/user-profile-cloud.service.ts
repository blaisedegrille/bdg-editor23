import { Injectable } from '@angular/core';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { isLanguage, Language } from './i18n/language';
import { db } from './firebase';

/** Firestore access for the parts of a user profile owned by the settings UI. */
@Injectable({
  providedIn: 'root',
})
export class UserProfileCloudService {
  async loadLanguage(uid: string): Promise<Language | null> {
    const snapshot = await getDoc(doc(db, 'users', uid));
    const language = snapshot.data()?.['language'];
    return isLanguage(language) ? language : null;
  }

  async saveLanguage(uid: string, language: Language): Promise<void> {
    await setDoc(doc(db, 'users', uid), { language }, { merge: true });
  }
}
