import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import PeriodTracker from './PeriodTracker';
import MemberCenter from './MemberCenter';
import PrivacyPolicy from './PrivacyPolicy';

type EventItem = {
  id: string;
  user_id: string;
  date: string;
  title: string;
  category: string;
  time?: string;
  reminder?: boolean;
};
const categories = [
  { name: '生活', icon: '🌸', color: 'life' },
  { name: '工作', icon: '💼', color: 'work' },
  { name: '約會', icon: '💗', color: 'date' },
  { name: '購物', icon: '🛍️', color: 'shopping' },
  { name: '生日', icon: '🎂', color: 'birthday' },
];

export default function App() {
  const today = new Date();
  const todayKey =
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [todos, setTodos] = useState<string[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newTodo, setNewTodo] = useState('');
  const [newCategory, setNewCategory] = useState('生活');
  const [newTime, setNewTime] = useState('09:00');
  const [newReminder, setNewReminder] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'period' | 'member'>('calendar');
  const [periodDates, setPeriodDates] = useState<string[]>([]);
  const handlePeriodDatesChange = useCallback((dates: string[]) => setPeriodDates(dates), []);

  // 確認目前登入狀態
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setAuthMessage(error.message);
      }
      setUser(data.session?.user ?? null);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 登入後讀取這位會員自己的雲端行程
  useEffect(() => {
    if (!user) {
      setEvents([]);
      return;
    }

    let active = true;

    const loadEvents = async () => {
      setEventsLoading(true);

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (!active) return;

      if (error) {
        window.alert('讀取行程失敗：' + error.message);
      } else {
        setEvents((data || []) as EventItem[]);
      }

      setEventsLoading(false);
    };

    loadEvents();

    return () => {
      active = false;
    };
  }, [user]);

  const handleAuth = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthMessage('');

    if (!email.trim() || !password) {
      setAuthMessage('請輸入電子郵件和密碼喔！');
      return;
    }

    if (password.length < 6) {
      setAuthMessage('密碼至少需要 6 個字元。');
      return;
    }

    setAuthBusy(true);

    if (authMode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        setAuthMessage(error.message);
      } else if (data.session) {
        setAuthMessage('註冊成功！歡迎加入 Pinky Day 🎀');
      } else {
        setAuthMessage('註冊成功！請到電子郵件收取驗證信，完成驗證後再登入。');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setAuthMessage('登入失敗：' + error.message);
      } else {
        setAuthMessage('登入成功！歡迎回來 ❤️');
      }
    }

    setAuthBusy(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      window.alert('登出失敗：' + error.message);
    } else {
      setEditingId(null);
      resetForm();
    }
  };

  const days = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const dateKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const resetForm = () => {
    setNewTitle('');
    setNewCategory('生活');
    setNewTime('09:00');
    setNewReminder(true);
    setEditingId(null);
  };

  const saveEvent = async () => {
    if (!user) return;

    if (!newTitle.trim()) {
      window.alert('請先輸入行程名稱喔！');
      return;
    }

    const eventData = {
      user_id: user.id,
      title: newTitle.trim(),
      date: selectedDate,
      category: newCategory,
      time: newTime,
      reminder: newReminder,
    };

    if (editingId !== null) {
      const { data, error } = await supabase
        .from('calendar_events')
        .update(eventData)
        .eq('id', editingId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        window.alert('修改失敗：' + error.message);
        return;
      }

      setEvents(items =>
        items.map(item =>
          item.id === editingId ? (data as EventItem) : item
        )
      );
    } else {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert(eventData)
        .select()
        .single();

      if (error) {
        window.alert('新增失敗：' + error.message);
        return;
      }

      setEvents(items => [...items, data as EventItem]);
    }

    resetForm();
  };

  const editEvent = (item: EventItem) => {
    setEditingId(item.id);
    setNewTitle(item.title);
    setNewCategory(item.category || '生活');
    setNewTime(item.time || '09:00');
    setNewReminder(item.reminder ?? false);
    setSelectedDate(item.date);

    const parts = item.date.split('-').map(Number);
    setYear(parts[0]);
    setMonth(parts[1] - 1);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteEvent = async (id: string) => {
    if (!user) return;
    if (!window.confirm('確定要刪除這個行程嗎？')) return;

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      window.alert('刪除失敗：' + error.message);
      return;
    }

    setEvents(items => items.filter(item => item.id !== id));

    if (editingId === id) {
      resetForm();
    }

    localStorage.removeItem(`pinky-notified-${id}`);
  };

  const monthChange = (amount: number) => {
    const next = new Date(year, month + amount, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  const selectedEvents = events
    .filter(item => item.date === selectedDate)
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  // 提醒：只有在網頁開啟時檢查
  useEffect(() => {
    if (!user) return;

    const checkReminders = () => {
      const now = new Date();

      const currentDate =
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const currentTime =
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      events.forEach(event => {
        const notified = localStorage.getItem(
          `pinky-notified-${event.id}`
        );

        if (
          event.reminder &&
          event.time &&
          event.date === currentDate &&
          event.time === currentTime &&
          !notified
        ) {
          localStorage.setItem(
            `pinky-notified-${event.id}`,
            'yes'
          );

          window.alert(
            `🎀 Pinky Day 行程提醒\n\n${event.title}\n時間：${event.time}`
          );
        }
      });
    };

    checkReminders();
    const timer = window.setInterval(checkReminders, 10000);

    return () => window.clearInterval(timer);
  }, [events, user]);

  // 公開隱私權政策頁，不需要登入
  if (window.location.pathname === '/privacy') {
    return <PrivacyPolicy />;
  }

  // 尚未登入：顯示會員登入頁
  if (authLoading) {
    return (
      <main className="app">
        <section className="card">
          <h1>🎀 Pinky Day</h1>
          <p>正在準備你的小日常……</p>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="app">
        <header className="top">
          <div>
            <span className="small-title">MY LITTLE WORLD</span>
            <h1>🎀 Pinky Day</h1>
            <p>把每一天，過成喜歡的樣子。</p>
          </div>
          <span className="heart">♡</span>
        </header>

        <section className="card">
          <h2>
            {authMode === 'login' ? '💗 會員登入' : '🌸 建立新帳號'}
          </h2>

          <form onSubmit={handleAuth}>
            <label className="time-label">
              <span>📧 電子郵件</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="請輸入電子郵件"
                required
              />
            </label>

            <label className="time-label">
              <span>🔒 密碼（至少 6 個字元）</span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="請輸入密碼"
                minLength={6}
                required
              />
            </label>

            <button
              className="pink-button"
              type="submit"
              disabled={authBusy}
              style={{ width: '100%', marginTop: 16, padding: 12 }}
            >
              {authBusy
                ? '請稍候……'
                : authMode === 'login'
                  ? '登入 Pinky Day'
                  : '註冊新帳號'}
            </button>
          </form>

          {authMessage && (
            <p className="empty">{authMessage}</p>
          )}

          <p className="empty">
            {authMode === 'login'
              ? '還沒有帳號嗎？'
              : '已經有帳號了嗎？'}
          </p>

          <button
            type="button"
            onClick={() => {
              setAuthMode(authMode === 'login' ? 'signup' : 'login');
              setAuthMessage('');
            }}
          >
            {authMode === 'login' ? '立即註冊 ♡' : '返回登入'}
          </button>
        </section>

        <footer>Made with ♡ Pinky Day 粉日常 · <a href="/privacy">隱私權政策</a></footer>
      </main>
    );
  }

  return (
    <main className="app">
      <header className="top">
        <div>
          <span className="small-title">MY LITTLE WORLD</span>
          <h1>🎀 Pinky Day</h1>
          <p>把每一天，過成喜歡的樣子。</p>
          <small>{user.email}</small>
        </div>
        <span className="heart">♡</span>
      </header>

      <section className="card">
        <button type="button" onClick={handleLogout}>
          登出會員
        </button>
        {eventsLoading && <p>正在讀取雲端行程……</p>}
      </section>

      {activeTab === 'calendar' && <>
      <section className="calendar card">
        <div className="month-bar">
          <button onClick={() => monthChange(-1)}>‹</button>
          <h2>{year} 年 {month + 1} 月</h2>
          <button onClick={() => monthChange(1)}>›</button>
        </div>

        <div className="weekdays">
          {['日', '一', '二', '三', '四', '五', '六'].map(day => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="days">
          {Array.from({ length: firstDay }, (_, i) => (
            <span key={`empty-${i}`} />
          ))}

          {Array.from({ length: days }, (_, i) => {
            const day = i + 1;
            const key = dateKey(day);
            const active = selectedDate === key;
            const hasEvent = events.some(item => item.date === key);
            const hasPeriod = periodDates.includes(key);

            return (
              <button
                key={day}
                className={(active ? 'day active' : 'day') + (hasPeriod ? ' period-day' : '')}
                onClick={() => setSelectedDate(key)}
              >
                {day}
                {hasEvent && <i />}
                {hasPeriod && <b className="period-mark" />}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card">
        <h2>
          {editingId !== null ? '✏️ 編輯行程' : `🌷 ${selectedDate} 的行程`}
        </h2>

        <div className="add-row">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="今天想安排什麼呢？"
          />
          <button className="pink-button" onClick={saveEvent}>
            {editingId !== null ? '儲存修改' : '新增'}
          </button>
        </div>

        <div className="category-picker">
          <p>選擇行程分類</p>
          <div className="category-options">
            {categories.map(category => (
              <button
                key={category.name}
                type="button"
                className={`category-option ${category.color} ${newCategory === category.name ? 'chosen' : ''}`}
                onClick={() => setNewCategory(category.name)}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="reminder-settings">
          <label className="time-label">
            <span>📅 行程日期</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </label>

          <label className="time-label">
            <span>🕒 行程時間</span>
            <input
              type="time"
              value={newTime}
              onChange={e => setNewTime(e.target.value)}
            />
          </label>

          <label className="reminder-toggle">
            <input
              type="checkbox"
              checked={newReminder}
              onChange={e => setNewReminder(e.target.checked)}
            />
            <span>🔔 開啟行程提醒</span>
          </label>
        </div>

        {editingId !== null && (
          <button
            className="pink-button"
            style={{ marginTop: 12, padding: 12 }}
            onClick={resetForm}
          >
            取消編輯
          </button>
        )}

        {selectedEvents.length === 0 ? (
          <p className="empty">
            今天還沒有行程，留一點時間給自己吧 ♡
          </p>
        ) : (
          selectedEvents.map(item => {
            const category = categories.find(
              c => c.name === item.category
            ) || categories[0];

            return (
              <div className={`event ${category.color}`} key={item.id}>
                <div className="event-info">
                  <span>{item.title}</span>
                  <small>
                    {category.icon} {category.name}
                    {item.time ? ` · 🕒 ${item.time}` : ''}
                    {item.reminder ? ' · 🔔' : ''}
                  </small>
                </div>

                <button onClick={() => editEvent(item)}>
                  編輯
                </button>
                <button onClick={() => deleteEvent(item.id)}>
                  刪除
                </button>
              </div>
            );
          })
        )}
      </section>

      <section className="card">
        <h2>✨ 今日待辦</h2>

        <div className="add-row">
          <input
            value={newTodo}
            onChange={e => setNewTodo(e.target.value)}
            placeholder="寫下一件想完成的小事"
          />
          <button
            className="pink-button"
            onClick={() => {
              if (newTodo.trim()) {
                setTodos([...todos, newTodo.trim()]);
                setNewTodo('');
              }
            }}
          >
            新增
          </button>
        </div>

        {todos.map((todo, index) => (
          <label className="todo" key={`${todo}-${index}`}>
            <input
              type="checkbox"
              onChange={() =>
                setTodos(todos.filter((_, i) => i !== index))
              }
            />
            {todo}
          </label>
        ))}

        {todos.length === 0 && (
          <p className="empty">
            完成一件小事，也值得給自己一個愛心 ♡
          </p>
        )}
      </section>

      </>}

      {activeTab === 'period' && <PeriodTracker userId={user.id} onDatesChange={handlePeriodDatesChange} />}

      {activeTab === 'member' && <MemberCenter userId={user.id} />}

      <nav className="bottom-tabs" aria-label="主要功能">
        <button type="button" className={activeTab === 'calendar' ? 'active' : ''} onClick={() => setActiveTab('calendar')}>📅 月曆</button>
        <button type="button" className={activeTab === 'period' ? 'active' : ''} onClick={() => setActiveTab('period')}>🌸 月經紀錄</button>
        <button type="button" className={activeTab === 'member' ? 'active' : ''} onClick={() => setActiveTab('member')}>💗 關於 Pinky Day</button>
      </nav>
      <footer>Made with ♡ Pinky Day 粉日常 · <a href="/privacy">隱私權政策</a></footer>
    </main>
  );
}
