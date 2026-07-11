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

    // 计算下一个渲染时的缩放比例
    const newScale = Math.max(0.55, noScale * 0.93);
    setNoScale(newScale);

    const pad = 20;
    const w = window.innerWidth;
    const h = window.innerHeight;

    // 获取"好呀"按钮的边界
    const yesBtn = document.querySelector(".btn-yes");
    const yesRect = yesBtn ? yesBtn.getBoundingClientRect() : null;

    // 获取"才不要"按钮的真实物理大小（防二次缩放计算错误）
    const noBtn = document.querySelector(".btn-no");
    const noRect = noBtn ? noBtn.getBoundingClientRect() : null;

    let baseW = 80; // 默认估算宽
    let baseH = 32; // 默认估算高

    if (noBtn) {
      if (!noBtn.dataset.baseW && noRect) {
        // 第一次逃跑时，根据当前缩放反推无缩放的基础大小
        noBtn.dataset.baseW = String(noRect.width / noScale);
        noBtn.dataset.baseH = String(noRect.height / noScale);
      }
      if (noBtn.dataset.baseW) {
        baseW = parseFloat(noBtn.dataset.baseW);
        baseH = parseFloat(noBtn.dataset.baseH);
      }
    }

    const btnW = baseW * newScale;
    const btnH = baseH * newScale;

    let top, left;
    let attempts = 0;
    const maxAttempts = 100;
    const minDistance = 25; // 与"好呀"按钮之间的最小安全距离

    do {
      top = pad + Math.random() * Math.max(0, h - btnH - pad * 2);
      left = pad + Math.random() * Math.max(0, w - btnW - pad * 2);
      attempts++;

      if (!yesRect) break;

      // 检查矩形重叠（包含安全距离）
      const overlaps = !(
        left + btnW + minDistance < yesRect.left ||
        left - minDistance > yesRect.right ||
        top + btnH + minDistance < yesRect.top ||
        top - minDistance > yesRect.bottom
      );

      if (!overlaps) break;
    } while (attempts < maxAttempts);

    // 兜底：如果多次尝试还是重叠（比如屏幕极小），强制放置到屏幕上/下对侧区域
    if (attempts >= maxAttempts && yesRect) {
      if (yesRect.top > h / 2) {
        // "好呀"按钮在偏下，强制把"才不要"放置在偏上安全区域
        top = pad + Math.random() * Math.max(0, yesRect.top - btnH - minDistance - pad);
      } else {
        // "好呀"按钮在偏上，强制把"才不要"放置在偏下安全区域
        const startY = yesRect.bottom + minDistance;
        top = startY + Math.random() * Math.max(0, h - btnH - pad - startY);
      }
      left = pad + Math.random() * Math.max(0, w - btnW - pad * 2);
    }

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
