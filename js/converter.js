// js/converter.js

import { db } from "./firebase.js";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/**
 * Main resolver:
 * input → user object { id, ...data }
 */
export async function resolveUser(input) {
  if (!input) return null;

  const cleaned = input.toString().trim().replace("@", "");

  // 1. Try UID first (FASTEST PATH)
  const byId = await getUserById(cleaned);
  if (byId) return byId;

  // 2. Try username exact match
  const byUsername = await getUserByUsername(cleaned);
  if (byUsername) return byUsername;

  // 3. Optional fallback: partial match
  const byPartial = await getUserByPartialUsername(cleaned);
  if (byPartial) return byPartial;

  return null;
}
