import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Wheel from "../components/Wheel";
import { getSessionId } from "../lib/session";

const LETTER = [
  { text: "亲爱的 BB：", dear: true },
  {
    text: "我知道我欠你一个正式的和好道歉。但就像我今天向你所说的那样，我不希望我们在情绪上头的时候，做出让我们后悔的决定。我也知道你这段时间受了许多委屈，我真的真的很心疼。",
  },
  {
    text: "我欠你的实在太多了，我想要弥补弥补你，也真诚地希望我能有多一些时间，去用行动让你感受到我对你的关心和在乎。",
  },
  {
    text: "谢谢你愿意和我和好（虽然我知道我有点不讲武德，但我不管，你点了，就是答应和好了 Blek）。我也知道，和好又岂能只是嘴巴、文字就可以了。",
  },
  { text: "所以，这次我们来点特别的 ——" },
  { text: "让你随机抽奖，看看抽到什么 🎁", dear: true },
];

export default function LetterPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false); // 服务器状态确认完毕
  const [rolled, setRolled] = useState(false); // 字幕滚完
  const [showSkip, setShowSkip] = useState(false);
  const [showWheel, setShowWheel] = useState(false);
  const [result, setResult] = useState(null); // 中奖奖品全名


  // 进页面先问服务器：有没有点过好呀？抽过奖没？
  useEffect(() => {
    const sessionId = getSessionId();
    fetch(`/api/draw?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.saidYes) {
          router.replace("/"); // 没点过好呀，回去重走流程
          return;
        }
        if (data.drawn) {
          setResult(data.prize); // 已抽过：直接显示结果，不给第二次
          setRolled(true);
        }
        setReady(true);
      })
      .catch(() => setReady(true)); // 网络异常也让她看信
  }, [router]);

  // 5 秒后出现"跳到最后"按钮
  useEffect(() => {
    if (!ready || rolled) return;
    const t = setTimeout(() => setShowSkip(true), 3000);
    return () => clearTimeout(t);
  }, [ready, rolled]);



  function onDrawn(prizeFull) {
    setShowWheel(false);
    setResult(prizeFull);
  }

  if (!ready) return null;

  return (
    <main className="letter-page">


      {/* 电影片尾式滚动信件 */}
      {!result && !rolled && (
        <>
          <div className="roll-viewport">
            <div className="roll-text" onAnimationEnd={() => setRolled(true)}>
              {LETTER.map((p, i) => (
                <p key={i} className={p.dear ? "dear" : ""}>
                  {p.text}
                </p>
              ))}
            </div>
          </div>
          {showSkip && (
            <button className="skip-btn" onClick={() => setRolled(true)}>
              跳到最后 ⏭
            </button>
          )}
        </>
      )}

      {/* 字幕滚完：出现抽奖入口 */}
      {rolled && !result && !showWheel && (
        <div className="draw-cta-wrap">
          <button className="draw-cta" onClick={() => setShowWheel(true)}>
            开始抽奖 🎁
          </button>
          <div className="draw-cta-sub">只有一次机会哦，抽到什么都算数 ✌️</div>
        </div>
      )}

      {/* 轮盘弹窗 */}
      {showWheel && (
        <div className="modal-overlay">
          <Wheel onResult={onDrawn} />
        </div>
      )}

      {/* 中奖结果 */}
      {result && (
        <div className="modal-overlay">
          <div className="result-card">
            <div className="emoji">🎉</div>
            <h2>恭喜 BB 抽中</h2>
            <div className="result-prize">{result}</div>
            <div className="result-note">
              截图保存好，凭这张图找我兑现 💗
              <br />
              有效期：一辈子
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
