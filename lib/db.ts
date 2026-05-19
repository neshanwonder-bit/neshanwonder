"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { ClosetItem } from "./schema";

interface ClosetDB extends DBSchema {
  items: {
    key: string;
    value: ClosetItem;
    indexes: { "by-category": string; "by-createdAt": number };
  };
}

let dbPromise: Promise<IDBPDatabase<ClosetDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ClosetDB>("neshanwonder", 1, {
      upgrade(db) {
        const store = db.createObjectStore("items", { keyPath: "id" });
        store.createIndex("by-category", "category");
        store.createIndex("by-createdAt", "createdAt");
      },
    });
  }
  return dbPromise;
}

export async function putItem(item: ClosetItem) {
  const db = await getDB();
  await db.put("items", item);
}

export async function getItem(id: string): Promise<ClosetItem | undefined> {
  const db = await getDB();
  return db.get("items", id);
}

export async function getAllItems(): Promise<ClosetItem[]> {
  const db = await getDB();
  const items = await db.getAll("items");
  return items.sort((a, b) => b.createdAt - a.createdAt);
}

export async function deleteItem(id: string) {
  const db = await getDB();
  await db.delete("items", id);
}
