type Props = { userId: string };

export default function MemberCenter(_props: Props) {
  return (
    <section className="member-page">
      <section className="card member-hero">
        <span className="member-eyebrow">PINKY DAY · FREE FOR EVERYONE</span>
        <h2>🎀 Pinky Day 粉日常</h2>
        <p>把每一天，過成喜歡的樣子。</p>
        <div className="member-status">
          <strong>🌷 全部基本功能免費</strong>
          <span>不用訂閱、不用付月費，也能安心使用 Pinky Day。</span>
        </div>
      </section>

      <section className="card">
        <h2>💕 免費使用的功能</h2>
        <ul className="member-benefits">
          <li>月曆與日常行程紀錄</li>
          <li>行程分類與提醒</li>
          <li>今日待辦清單</li>
          <li>月經開始、結束與身體狀況紀錄</li>
          <li>預測下次月經日期與基本週期日曆</li>
        </ul>
        <p className="member-note">月經預測會持續免費提供。預測僅供日常參考，不可作為避孕或醫療診斷依據。</p>
      </section>

      <section className="card">
        <h2>🌸 未來支持 Pinky Day 的方式</h2>
        <div className="support-option">
          <strong>📢 友善廣告</strong>
          <p>未來可能加入少量廣告，盡量不打擾你的日常使用。</p>
        </div>
        <div className="support-option">
          <strong>🎨 可愛主題與貼紙</strong>
          <p>未來可能推出自選背景、月曆主題和裝飾貼紙，採自願購買。</p>
        </div>
        <div className="support-option">
          <strong>🎁 品牌合作與好物推薦</strong>
          <p>未來可能分享適合日常生活的合作商品，並清楚標示合作或推薦內容。</p>
        </div>
        <p className="member-note">以上都是未來規劃，目前尚未開放廣告、付費主題或商品販售，不會向你收費。</p>
      </section>
    </section>
  );
}
