export default function About() {
  return (
    <main className="app">
      <header className="top">
        <div>
          <span className="small-title">MY LITTLE WORLD</span>
          <h1>🎀 Pinky Day 粉日常</h1>
          <p>把每一天，過成喜歡的樣子。</p>
        </div>
        <span className="heart">♡</span>
      </header>

      <section className="card">
        <h2>讓生活安排，變得簡單又可愛</h2>
        <p>Pinky Day 是一個以日常規劃為主的小工具，陪你整理行程、記下待辦，也能記錄自己的生理週期。</p>
      </section>

      <section className="card">
        <h2>📅 日常月曆與行程</h2>
        <p>用月曆查看日期，新增、編輯或刪除生活、工作、約會、購物及生日等行程，並設定時間與提醒。</p>
      </section>

      <section className="card">
        <h2>✨ 今日待辦</h2>
        <p>把想完成的小事記下來，完成後勾選，讓每天的安排更清楚。</p>
      </section>

      <section className="card">
        <h2>🌸 免費月經紀錄</h2>
        <p>可自行記錄月經日期、相關狀況，並依照已輸入的週期資料估算下次月經日期。預測僅供日常參考，不是醫療診斷或避孕依據。</p>
      </section>

      <section className="card">
        <h2>💗 開始使用 Pinky Day</h2>
        <p>建立帳號並登入，即可使用個人行程與月經紀錄功能。你的紀錄是為了提供你使用的功能，不應作為個人化廣告鎖定資料。</p>
        <a href="/" className="pink-button" style={{ display: 'inline-block', textDecoration: 'none' }}>前往登入／免費註冊</a>
      </section>

      <section className="card">
        <h2>📚 免費使用指南</h2>
        <p>想了解如何安排月曆、使用待辦或記錄週期？</p>
        <p><a href="/guides">閱讀 Pinky Day 使用指南</a></p>
      </section>

      <section className="card">
        <h2>需要協助嗎？</h2>
        <p><a href="/contact">聯絡 Pinky Day 客服</a></p>
        <p><a href="/privacy">閱讀隱私權政策</a></p>
      </section>
      <footer>Made with ♡ Pinky Day 粉日常</footer>
    </main>
  );
}
