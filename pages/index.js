import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { getSessionId } from "../lib/session";

// "才不要" 按钮每次逃跑后的求饶文案
const NO_PHRASES = [
  "才不要",
  "你确定？",
  "再想想嘛",
  "哼，点不到点不到",
  "BB 别这样 🥺",
  "我错了还不行吗",
  "手滑了吧？",
  "这个按钮今天休息",
  "点隔壁那个啦！",
];

const HEARTS = ["🩷", "💗", "❤️", "💘", "💕"];

export default function AskPage() {
  const router = useRouter();
  const [noIndex, setNoIndex] = useState(0);
  const [fleeing, setFleeing] = useState(false);
  const [noPos, setNoPos] = useState({ top: 0, left: 0 });
  const [noScale, setNoScale] = useState(1);
  const [toast, setToast] = useState("");
  const [leaving, setLeaving] = useState(false);
  const dodgeCount = useRef(0);

  useEffect(() => {
    router.prefetch("/letter");
  }, [router]);

  // "才不要" 逃跑：换随机位置 + 换文案 + 缩小
  function dodge(e) {
    if (e && e.cancelable) e.preventDefault();
    dodgeCount.current += 1;
    setFleeing(true);
    setNoIndex((i) => (i + 1) % NO_PHRASES.length);
    setNoScale((s) => Math.max(0.55, s * 0.93));

    const pad = 20;
    const w = window.innerWidth;
    const h = window.innerHeight;
    // 避开屏幕正中间（好呀按钮区域），只在四周游走
    let top, left;
    do {
      top = pad + Math.random() * (h - 120);
      left = pad + Math.random() * (w - 160);
    } while (top > h * 0.3 && top < h * 0.68 && left > w * 0.1 && left < w * 0.8);
    setNoPos({ top, left });

    // 悄悄记录她挣扎了几次 😂（失败也无所谓）
    fetch("/api/dodge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: getSessionId() }),
    }).catch(() => {});
  }

  // 万一真的被点到（兜底）
  function noClicked(e) {
    e.preventDefault();
    setToast("这个按钮好像坏掉了呢，试试另一个 😏");
    setTimeout(() => setToast(""), 2200);
    dodge(e);
  }

  async function sayYes() {
    if (leaving) return;
    setLeaving(true);
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#e85d75", "#ff8fab", "#ffd6e0", "#e8b54a"],
        scalar: 1.2,
      });
    } catch {}
    // 记录点击"好呀"的日期时间
    try {
      await fetch("/api/yes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId() }),
      });
    } catch {}
    setTimeout(() => router.push("/letter"), 700);
  }

  return (
    <main className="ask-page">
      {/* 飘落爱心背景 */}
      {HEARTS.concat(HEARTS).map((h, i) => (
        <span
          key={i}
          className="heart-float"
          style={{
            left: `${(i * 11 + 4) % 96}%`,
            animationDuration: `${7 + (i % 5) * 2.3}s`,
            animationDelay: `${i * 1.15}s`,
            fontSize: `${1 + (i % 3) * 0.45}rem`,
          }}
        >
          {h}
        </span>
      ))}

      <h1 className="ask-title hand">
        BB
        <br />
        我们和好好不好
      </h1>

      <button className="btn-yes" onClick={sayYes} disabled={leaving}>
        好&nbsp;呀
      </button>
      <div className="yes-hint">✨ 点击这个 button 会有一次抽奖机会哦 ✨</div>

      <button
        className={`btn-no ${fleeing ? "fleeing" : ""}`}
        style={
          fleeing
            ? { top: noPos.top, left: noPos.left, transform: `scale(${noScale})` }
            : undefined
        }
        onTouchStart={dodge}
        onMouseEnter={dodge}
        onClick={noClicked}
      >
        {NO_PHRASES[noIndex]}
      </button>

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}
