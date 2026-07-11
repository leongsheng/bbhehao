// 浏览器端的 sessionId：第一次访问时生成并存 localStorage
export function getSessionId() {
  if (typeof window === "undefined") return null;
  let id = localStorage.getItem("bb_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("bb_session_id", id);
  }
  return id;
}
