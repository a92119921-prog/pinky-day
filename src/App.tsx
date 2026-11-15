
import { useState } from 'react';

type EventItem = {
  id: number;
  date: string;
  title: string;
  category: string;
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
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  );

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

  const saveEvents = (items: EventItem[]) => {
    setEvents(items);
    localStorage.setItem('pinky-events', JSON.stringify(items));
  };

  const days = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const dateKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const addEvent = () => {
    if (!newTitle.trim()) return;

    saveEvents([
      ...events,
      {
        id: Date.now(),
        date: selectedDate,
        title: newTitle.trim(),
        category: newCategory,
      },
    ]);

    setNewTitle('');
    setNewCategory('生活');
  };

  const monthChange = (amount: number) => {
    const next = new Date(year, month + amount, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  };

  const selectedEvents = events.filter(
    item => item.date === selectedDate
  );

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
        <h2>🌷 {selectedDate} 的行程</h2>

        <div className="add-row">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="今天想安排什麼呢？"
          />
          <button className="pink-button" onClick={addEvent}>
            新增
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
                  </small>
                </div>
                <button
                  onClick={() =>
                    saveEvents(events.filter(e => e.id !== item.id))
                  }
                >
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
