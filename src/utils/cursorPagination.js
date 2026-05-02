import mongoose from "mongoose";

/** Escape special regex characters in user-provided search strings */
export function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function encodeCursor(doc) {
  if (!doc?.createdAt || !doc?._id) return null;
  const payload = JSON.stringify({
    t: new Date(doc.createdAt).getTime(),
    id: String(doc._id),
  });
  return Buffer.from(payload, "utf8").toString("base64url");
}

export function decodeCursor(cursorParam) {
  if (!cursorParam || typeof cursorParam !== "string") return null;
  try {
    const raw = Buffer.from(cursorParam, "base64url").toString("utf8");
    const payload = JSON.parse(raw);
    if (!payload.t || !payload.id) return null;
    return {
      createdAt: new Date(payload.t),
      _id: new mongoose.Types.ObjectId(payload.id),
    };
  } catch {
    return null;
  }
}

/** Compound cursor filter for sort { createdAt: -1, _id: -1 } */
export function compoundLtFilter(cursorDecoded) {
  if (!cursorDecoded) return {};
  const { createdAt, _id } = cursorDecoded;
  return {
    $or: [
      { createdAt: { $lt: createdAt } },
      { $and: [{ createdAt }, { _id: { $lt: _id } }] },
    ],
  };
}
