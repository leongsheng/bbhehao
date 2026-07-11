import { getDb } from "../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { sessionId } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: "缺少 sessionId" });

  try {
    const db = await getDb();
    const col = db.collection("events");
    const now = new Date();
    const existing = await col.findOne({ sessionId });

    if (existing && existing.saidYesAt) {
      // 已经点过"好呀"，不覆盖第一次的时间
      return res.json({ ok: true, saidYesAt: existing.saidYesAt });
    }

    await col.updateOne(
      { sessionId },
      {
        $set: {
          saidYesAt: now,
          // 马来西亚时间的可读版本，方便你直接在数据库里看
          saidYesAtLocal: now.toLocaleString("zh-CN", { timeZone: "Asia/Kuala_Lumpur" }),
          userAgent: req.headers["user-agent"] || "",
        },
        $setOnInsert: { sessionId, noButtonDodges: 0, prize: null, drawnAt: null },
      },
      { upsert: true }
    );
    return res.json({ ok: true, saidYesAt: now });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "数据库错误" });
  }
}
