import { useEffect, useState } from 'react';
import { supabase } from './supabase';

type Membership = {
  plan: 'monthly' | 'yearly';
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  current_period_end: string | null;
};

type Props = { userId: string };

const benefits = [
  '長期週期趨勢與統計圖表',
  '更多個人化提醒設定',
  '專屬日記主題與粉色版面',
  '進階月曆與生活統計',
];

export default function MemberCenter({ userId }: Props) {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    const loadMembership = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('vip_memberships')
        .select('plan,status,current_period_end')
        .eq('user_id', userId)
        .maybeSingle();
      if (!active) return;
      if (error) {
        setMessage('會員資料讀取失敗：' + error.message);
        setMembership(null);
      } else {
        setMembership(data as Membership | null);
        setMessage('');
      }
      setLoading(false);
    };
    void loadMembership();
    return () => { active = false; };
  }, [userId]);

  const isActive = membership?.status === 'active' &&
    (!membership.current_period_end || new Date(membership.current_period_end).getTime() > Date.now());

  return (
    <section className="member-page">
      <section className="card member-hero">
        <span className="member-eyebrow">PINKY DAY · MEMBERSHIP</span>
        <h2>💎 我的會員中心</h2>
        <p>讓每天的生活紀錄，多一點專屬的小美好。</p>
        {loading ? <p>正在讀取會員資料……</p> : (
          <div className={isActive ? 'member-status vip' : 'member-status'}>
            <strong>{isActive ? '✨ VIP 會員' : '🌷 免費會員'}</strong>
            <span>{isActive
              ? `方案：${membership?.plan === 'yearly' ? '年費方案' : '月費方案'}`
              : '目前使用 Pinky Day 免費功能'}</span>
            {isActive && membership?.current_period_end && (
              <small>有效期限：{new Date(membership.current_period_end).toLocaleDateString('zh-TW')}</small>
            )}
          </div>
        )}
        {message && <p className="member-message">{message}</p>}
      </section>

      <section className="card">
        <h2>🌸 免費版，持續陪伴你</h2>
        <ul className="member-benefits">
          <li>月曆與日常行程紀錄</li>
          <li>月經開始、結束與身體狀況紀錄</li>
          <li>預測下次月經日期</li>
          <li>基本週期日曆</li>
        </ul>
        <p className="member-note">下次月經日期預測永久保留免費使用，不需要升級 VIP。</p>
      </section>

      <section className="card member-vip-card">
        <span className="member-eyebrow">A LITTLE MORE FOR YOU</span>
        <h2>💎 Pinky Day VIP</h2>
        <p className="member-price">NT$60 <small>/ 月</small></p>
        <p className="member-year-price">或 NT$490 / 年（平均每月約 NT$41）</p>
        <ul className="member-benefits">
          {benefits.map(item => <li key={item}>{item}</li>)}
        </ul>
        <button type="button" className="pink-button member-upgrade" disabled>
          正式付款即將開放
        </button>
        <p className="member-note">目前先開放會員方案預覽；尚未收款，也不會自動開通 VIP。付款功能完成後會在這裡更新。</p>
      </section>
    </section>
  );
}
