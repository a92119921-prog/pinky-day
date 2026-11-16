export default function Contact() {
  return (
    <main className="app">
      <header className="top">
        <div>
          <span className="small-title">PINKY DAY · SUPPORT</span>
          <h1>🎀 聯絡客服</h1>
          <p>有任何使用問題或建議，都歡迎寫信給我們。</p>
        </div>
        <span className="heart">♡</span>
      </header>

      <section className="card">
        <h2>💌 Pinky Day 客服信箱</h2>
        <p>電子郵件：<a href="mailto:pinkday.support@gmail.com">pinkday.support@gmail.com</a></p>
        <p>請在信件中簡單描述你遇到的問題，我們會盡力協助。</p>
        <a className="pink-button" href="mailto:pinkday.support@gmail.com" style={{ display: 'inline-block', textDecoration: 'none' }}>寄信給客服</a>
      </section>

      <section className="card">
        <a href="/" className="pink-button" style={{ display: 'inline-block', textDecoration: 'none' }}>返回 Pinky Day</a>
      </section>
      <footer>Made with ♡ Pinky Day 粉日常</footer>
    </main>
  );
}
