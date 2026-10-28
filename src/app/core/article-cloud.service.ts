import { Injectable } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';

import { Article } from '../models/article';
import { db } from './firebase';

/** Firestore payload of an article, excluding the document id. */
type ArticleDocument = Omit<Article, 'id'>;

function toDocument(article: Article): ArticleDocument {
  return {
    title: article.title,
    // Firestore rejects `undefined`, so normalise the Editor.js output first.
    content: JSON.parse(JSON.stringify(article.content)),
    authorId: article.authorId,
    authorName: article.authorName,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    publishedAt: article.publishedAt,
  };
}

function fromDocument(id: string, data: unknown): Article {
  return { ...(data as ArticleDocument), id };
}

/**
 * Stores published articles under `users/{uid}/articles/{id}`.
 * Failures are surfaced to the caller so the local draft is never lost.
 */
@Injectable({
  providedIn: 'root',
})
export class ArticleCloudService {
  async publish(article: Article): Promise<void> {
    await setDoc(
      doc(db, 'users', article.authorId, 'articles', article.id),
      toDocument(article)
    );
  }

  async fetchAll(uid: string): Promise<Article[]> {
    const snapshot = await getDocs(
      query(
        collection(db, 'users', uid, 'articles'),
        orderBy('updatedAt', 'desc')
      )
    );
    return snapshot.docs.map((entry) => fromDocument(entry.id, entry.data()));
  }

  async fetchOne(uid: string, id: string): Promise<Article | null> {
    const snapshot = await getDoc(doc(db, 'users', uid, 'articles', id));
    return snapshot.exists()
      ? fromDocument(snapshot.id, snapshot.data())
      : null;
  }

  async remove(uid: string, id: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid, 'articles', id));
  }
}
