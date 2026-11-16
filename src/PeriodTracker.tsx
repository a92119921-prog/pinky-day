import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from './supabase';

type PeriodRecord = {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string | null;
  flow: '少量' | '普通' | '較多';
  symptoms: string[];
  mood: string;
  notes: string;
};

type Props = {
  userId: string;
  onDatesChange: (dates: string[]) => void;
};

const symptomOptions = ['經痛', '胸部脹痛', '腹脹', '頭痛', '疲倦', '腰痠', '痘痘', '噁心'];

function dateOnly(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return dateOnly(date);
}

function dayDiff(a: string, b: string) {
  return Math.round((new Date(`${b}T12:00:00`).getTime() - new Date(`${a}T12:00:00`).getTime()) / 86400000);
}

export default function PeriodTracker({ userId, onDatesChange }: Props) {
  const [records, setRecords] = useState<PeriodRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(dateOnly(new Date()));
  const [endDate, setEndDate] = useState('');
  const [flow, setFlow] = useState<PeriodRecord['flow']>('普通');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [mood, setMood] = useState('平靜');
  const [notes, setNotes] = useState('');

  const loadRecords = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('period_records')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });
    if (error) {
      setMessage('讀取月經紀錄失敗：' + error.message + '。請先完成本頁下方的資料表設定。');
    } else {
      const rows = (data || []) as PeriodRecord[];
      setRecords(rows);
      setMessage('');
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadRecords();
  }, [userId]);

  const markedDates = useMemo(() => {
    const result = new Set<string>();
    records.forEach(record => {
      const last = record.end_date || record.start_date;
      const span = Math.max(0, Math.min(dayDiff(record.start_date, last), 14));
      for (let i = 0; i <= span; i += 1) result.add(addDays(record.start_date, i));
    });
    return Array.from(result);
  }, [records]);

  useEffect(() => {
    onDatesChange(markedDates);
  }, [markedDates, onDatesChange]);

  const prediction = useMemo(() => {
    const starts = [...new Set(records.map(record => record.start_date))].sort();
    if (starts.length < 2) return null;
    const intervals = starts.slice(1).map((date, index) => dayDiff(starts[index], date));
      .filter(days => days >= 15 && days <= 60)
      .slice(-6);
    if (!intervals.length) return null;
    const average = Math.round(intervals.reduce((sum, days) => sum + days, 0) / intervals.length);
    return { date: addDays(starts[starts.length - 1], average), average, count: intervals.length };
  }, [records]);

  const resetForm = () => {
    setEditingId(null);
    setStartDate(dateOnly(new Date()));
    setEndDate('');
    setFlow('普通');
    setSymptoms([]);
    setMood('平靜');
    setNotes('');
  };

  const saveRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (endDate && endDate < startDate) {
      setMessage('結束日期不能早於開始日期喔。');
      return;
    }
    setSaving(true);
    setMessage('');
    const payload = { user_id: userId, start_date: startDate, end_date: endDate || null, flow, symptoms, mood, notes: notes.trim() };
    const result = editingId
      ? await supabase.from('period_records').update(payload).eq('id', editingId).eq('user_id', userId)
      : await supabase.from('period_records').insert(payload);
    if (result.error) {
      setMessage('儲存失敗：' + result.error.message);
    } else {
      await loadRecords();
      resetForm();
      setMessage('紀錄已儲存 💗');
    }
    setSaving(false);
  };

  const editRecord = (record: PeriodRecord) => {
    setEditingId(record.id);
    setStartDate(record.start_date);
    setEndDate(record.end_date || '');
    setFlow(record.flow);
    setSymptoms(record.symptoms || []);
    setMood(record.mood || '平靜');
    setNotes(record.notes || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteRecord = async (id: string) => {
    if (!window.confirm('確定刪除這筆月經紀錄嗎？')) return;
    const { error } = await supabase.from('period_records').delete().eq('id', id).eq('user_id', userId);
    if (error) setMessage('刪除失敗：' + error.message);
    else {
      await loadRecords();
      if (editingId === id) resetForm();
    }
  };

  return (
    <section className="period-page">
      <section className="card period-hero">
        <span className="period-eyebrow">PINKY PERIOD · CARE FOR YOURSELF</span>
        <h2>🌸 我的生理紀錄</h2>
        <p>溫柔記下身體的變化，慢慢認識自己的週期。</p>
        <div className="period-prediction">
          <span>🌷 預測下次月經</span>
          {prediction ? (
            <>
              <strong>{prediction.date}</strong>
              <small>依最近 {prediction.count} 個週期間隔估算，平均約 {prediction.average} 天</small>
            </>
          ) : (
            <small>再記錄至少一次月經開始日期，就能開始估算週期。</small>
          )}
          <small>此日期為估算，週期可能自然變動，不能用於避孕或診斷。</small>
        </div>
      </section>

      <section className="card">
        <h2>{editingId ? '✏️ 編輯月經紀錄' : '💗 新增月經紀錄'}</h2>
        <form onSubmit={saveRecord} className="period-form">
          <label className="time-label"><span>開始日期</span><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required /></label>
          <label className="time-label"><span>結束日期</span><input type="date" value={endDate} min={startDate} onChange={e => setEndDate(e.target.value)} /></label>
          <label className="time-label"><span>經血量</span><select value={flow} onChange={e => setFlow(e.target.value as PeriodRecord['flow'])}><option>少量</option><option>普通</option><option>較多</option></select></label>
          <div>
            <p className="period-label">身體狀況（可複選）</p>
            <div className="period-chips">
              {symptomOptions.map(item => <button type="button" key={item} className={symptoms.includes(item) ? 'period-chip selected' : 'period-chip'} onClick={() => setSymptoms(current => current.includes(item) ? current.filter(value => value !== item) : [...current, item])}>{item}</button>)}
            </div>
          </div>
          <label className="time-label"><span>今天的心情</span><select value={mood} onChange={e => setMood(e.target.value)}>{['平靜', '開心', '煩躁', '低落', '疲憊', '焦慮'].map(item => <option key={item}>{item}</option>)}</select></label>
          <label className="period-notes"><span>備註</span><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="想記下的感受或其他身體變化……" rows={3} /></label>
          <div className="period-actions">
            <button className="pink-button" type="submit" disabled={saving}>{saving ? '儲存中……' : editingId ? '儲存修改' : '儲存紀錄'}</button>
            {editingId && <button type="button" onClick={resetForm}>取消</button>}
          </div>
        </form>
        {message && <p className="period-message">{message}</p>}
      </section>

      <section className="card">
        <h2>📖 歷史紀錄</h2>
        {loading ? <p className="empty">正在讀取紀錄……</p> : records.length === 0 ? <p className="empty">還沒有紀錄，從今天開始照顧自己吧 ♡</p> : records.map(record => (
          <article className="period-record" key={record.id}>
            <div><strong>{record.start_date}</strong><small>{record.end_date ? `至 ${record.end_date}` : '尚未填寫結束日期'} · 經血量：{record.flow}</small><small>{(record.symptoms || []).join('、') || '未記錄症狀'} · 心情：{record.mood || '未記錄'}</small>{record.notes && <p>{record.notes}</p>}</div>
            <div className="period-record-actions"><button type="button" onClick={() => editRecord(record)}>編輯</button><button type="button" onClick={() => deleteRecord(record.id)}>刪除</button></div>
          </article>
        ))}
      </section>
    </section>
  );
}
