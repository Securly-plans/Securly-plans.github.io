// js/converter.js

export async function resolveUser(input) {
  if (!input) return null;

  const cleaned = input.toString().trim().replace("@", "");

  // 1. If it's already a UID (fast path)
  if (isLikelyUserId(cleaned)) {
    const user = await getUserById(cleaned);
    return user;
  }

  // 2. Try username lookup
  const userByName = await getUserByUsername(cleaned);
  if (userByName) return userByName;

  // 3. Try partial match (optional but powerful)
  const userByPartial = await getUserByPartialName(cleaned);
  if (userByPartial) return userByPartial;

  return null;
}
