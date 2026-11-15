
import { useEffect, useState } from 'react';

type EventItem = {
  id: number;
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

  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(todayKey);

  const [events, setEvents] = useState<EventItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('pinky-events') || '[]');
    } catch {
      return [];
    }
  });

  const [todos, setTodos] = useState<string[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newTodo, setNewTodo] = useState('');
  const [newCategory, setNewCategory] = useState('生活');
  const [newTime, setNewTime] = useState('09:00');
  const [newReminder, setNewReminder] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const saveEvents = (items: EventItem[]) => {
    setEvents(items);
    localStorage.setItem('pinky-events', JSON.stringify(items));
  };

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();

      const currentDate =
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const currentTime =
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      events.forEach(event => {
        const notified = localStorage.getItem(`pinky-notified-${event.id}`);

        if (
          event.reminder &&
          event.time &&
          event.date === currentDate &&
          event.time === currentTime &&
          !notified
        ) {
          localStorage.setItem(`pinky-notified-${event.id}`, 'yes');
          window.alert(
            `🎀 Pinky Day 行程提醒\n\n${event.title}\n時間：${event.time}`
          );
        }
      });
    };

    checkReminders();
    const timer = window.setInterval(checkReminders, 10000);

    return () => window.clearInterval(timer);
  }, [events]);

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

  const saveEvent = () => {
    if (!newTitle.trim()) {
      window.alert('請先輸入行程名稱喔！');
      return;
    }

    if (editingId !== null) {
      const updated = events.map(item =>
        item.id === editingId
          ? {
              ...item,
              title: newTitle.trim(),
              date: selectedDate,
              category: newCategory,
              time: newTime,
              reminder: newReminder,
            }
          : item
      );

      saveEvents(updated);
    } else {
      saveEvents([
        ...events,
        {
          id: Date.now(),
          date: selectedDate,
          title: newTitle.trim(),
          category: newCategory,
          time: newTime,
          reminder: newReminder,
        },
      ]);
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

  const deleteEvent = (id: number) => {
    saveEvents(events.filter(item => item.id !== id));

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

            return (
              <button
                key={day}
                className={active ? 'day active' : 'day'}
                onClick={() => setSelectedDate(key)}
              >
                {day}
                {hasEvent && <i />}
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

      <footer>Made with ♡ Pinky Day 粉日常</footer>
    </main>
  );
}
