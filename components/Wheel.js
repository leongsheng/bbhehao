import { useRef, useState } from "react";
import { PRIZES } from "../lib/prizes";
import { getSessionId } from "../lib/session";

const SEG = 360 / PRIZES.length; // 每格 45°

export default function Wheel({ onResult }) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [done, setDone] = useState(false);
  const pending = useRef(null);

  async function spin() {
    if (spinning || done) return;
    setSpinning(true);
    try {
      const res = await fetch("/api/draw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId() }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "出了点小问题，再试一次");
        setSpinning(false);
        return;
      }
      pending.current = data;

      // 指针固定在顶部。要让第 i 格的中心停在指针下：
      // 格子中心角 = i*45 + 22.5，逆着转过去 = 360 - 中心角
      // 加 6 整圈制造悬念，再加 ±14° 内的随机偏移，让它不总是停在正中间
      const center = data.prizeIndex * SEG + SEG / 2;
      const jitter = (Math.random() - 0.5) * (SEG * 0.6);
      const target = 360 * 6 + (360 - center) + jitter;
      // 强制 reflow 后再设置，确保 transition 生效
      requestAnimationFrame(() => setRotation(target));
    } catch {
      alert("网络不太好，再点一次试试");
      setSpinning(false);
    }
  }

  async function handleStop() {
    if (!pending.current) return;
    setDone(true);
    setSpinning(false);
    try {
      const confetti = (await import("canvas-confetti")).default;
      const burst = (x) =>
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { x, y: 0.55 },
          colors: ["#e85d75", "#ff8fab", "#ffd6e0", "#e8b54a", "#fff3f5"],
          zIndex: 200,
        });
      burst(0.2);
      burst(0.8);
      setTimeout(() => burst(0.5), 350);
    } catch {}
    const { prize, prizeIndex } = pending.current;
    setTimeout(() => onResult(prize, prizeIndex), 900);
  }

  return (
    <div className="wheel-card">
      <h2>幸运大转盘</h2>
      <div className="once">机会只有一次哦，深呼吸 ——</div>
      <div className="wheel-wrap">
        <div className="wheel-pointer" />
        <div
          className={`wheel ${spinning ? "spinning" : ""}`}
          style={{ transform: `rotate(${rotation}deg)` }}
          onTransitionEnd={handleStop}
        >
          {PRIZES.map((p, i) => (
            <div
              key={i}
              className="wheel-label"
              style={{
                // 每格中心角度；-90° 让文字沿半径从圆心指向外
                transform: `rotate(${i * SEG + SEG / 2 - 90}deg)`,
              }}
            >
              {p.short}
            </div>
          ))}
        </div>
        {/* GO 按钮放在轮盘外层，不跟着转 */}
        <button className="wheel-go" onClick={spin} disabled={spinning || done}>
          {spinning ? "..." : "GO!"}
        </button>
      </div>
    </div>
  );
}
