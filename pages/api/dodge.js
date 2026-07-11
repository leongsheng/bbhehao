import { getDb } from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { sessionId } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: "缺少 sessionId" });

  try {
    const db = await getDb();
    await db.collection("events").updateOne(
      { sessionId },
      {
        $inc: { noButtonDodges: 1 },
        $setOnInsert: { sessionId, saidYesAt: null, prize: null, drawnAt: null },
      },
      { upsert: true }
    );
    return res.json({ ok: true });
  } catch (e) {
    // 彩蛋接口，失败也无所谓
    return res.json({ ok: false });
  }
}
