import crypto from "crypto";
import { getDb } from "../../lib/mongodb";
import { PRIZES } from "../../lib/prizes";

export default async function handler(req, res) {
  const sessionId =
    req.method === "GET" ? req.query.sessionId : (req.body || {}).sessionId;
  if (!sessionId) return res.status(400).json({ error: "缺少 sessionId" });

  try {
    const db = await getDb();
    const col = db.collection("events");
    const doc = await col.findOne({ sessionId });

    // GET：查询当前状态（页面刷新后恢复用）
    if (req.method === "GET") {
      return res.json({
        saidYes: !!(doc && doc.saidYesAt),
        drawn: !!(doc && doc.prize),
        prize: doc?.prize || null,
        prizeIndex: doc?.prizeIndex ?? null,
      });
    }

    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    if (!doc || !doc.saidYesAt) {
      return res.status(403).json({ error: "要先点\u201c好呀\u201d才可以抽奖哦" });
    }

    // 核心保障：已经抽过就直接返回原结果，绝不给第二次
    if (doc.prize) {
      return res.json({ prize: doc.prize, prizeIndex: doc.prizeIndex, alreadyDrawn: true });
    }

    // 真随机：crypto.randomInt 是密码学级别的均匀随机
    const prizeIndex = crypto.randomInt(0, PRIZES.length);
    const prize = PRIZES[prizeIndex].full;
    const now = new Date();

    // 原子更新：只有 prize 仍为 null 才写入，防止并发双击
    const result = await col.updateOne(
      { sessionId, prize: null },
      {
        $set: {
          prize,
          prizeIndex,
          drawnAt: now,
          drawnAtLocal: now.toLocaleString("zh-CN", { timeZone: "Asia/Kuala_Lumpur" }),
        },
      }
    );

    if (result.modifiedCount === 0) {
      // 并发情况下被别的请求先写入了，返回数据库里的那个
      const fresh = await col.findOne({ sessionId });
      return res.json({ prize: fresh.prize, prizeIndex: fresh.prizeIndex, alreadyDrawn: true });
    }

    return res.json({ prize, prizeIndex, alreadyDrawn: false });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "数据库错误" });
  }
}
