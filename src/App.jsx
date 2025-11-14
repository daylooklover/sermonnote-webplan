import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import SermonGuidePage from './SermonGuidePage';
import EditSermonPage from './EditSermonPage';

// HomePage 컴포넌트 정의
const HomePage = ({ sermons, loading, handleInputChange, handleSubmit, handleLike, handleDelete, newSermon, searchTerm, setSearchTerm, currentUserId }) => (
  <>
    <form onSubmit={handleSubmit} className="sermon-form-container">
      <h2>새로운 설교 추가</h2>
      <div className="form-group">
        <label htmlFor="sermon-title">설교 제목</label>
        <input
          id="sermon-title"
          type="text"
          name="title"
          placeholder="설교 제목을 입력하거나, 붙여넣기 하세요."
          value={newSermon.title}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="sermon-preacher">설교자</label>
        <input
          id="sermon-preacher"
          type="text"
          name="preacher"
          placeholder="설교자를 입력하세요"
          value={newSermon.preacher}
          onChange={handleInputChange}
        />
      </div>
      <div className="form-group">
        <label htmlFor="sermon-location">설교 장소</label>
        <input
          id="sermon-location"
          type="text"
          name="location"
          placeholder="설교 장소를 입력하세요"
          value={newSermon.location}
          onChange={handleInputChange}
        />
      </div>
      <div className="form-group">
        <label htmlFor="sermon-content">설교 내용</label>
        <textarea
          id="sermon-content"
          name="content"
          placeholder="설교 내용을 작성하거나, 붙여넣기 하세요."
          value={newSermon.content}
          onChange={handleInputChange}
          required
        ></textarea>
      </div>
      <button type="submit" className="add-sermon-btn">설교 추가</button>
    </form>
    
    <div className="search-bar">
      <input
        type="text"
        placeholder="설교 검색..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>

    <div className="sermons-list">
      {sermons.length > 0 ? (
        sermons.map((sermon) => (
          <div key={sermon.id} className="sermon-card">
            <div className="sermon-meta">
              <span>**설교자:** {sermon.preacher || '정보 없음'}</span>
              <span>**장소:** {sermon.location || '정보 없음'}</span>
              <span>**게시자 ID:** {sermon.author_id}</span>
            </div>
            <h2>{sermon.title}</h2>
            <p>{sermon.content}</p>
            <div className="sermon-actions">
              <button onClick={() => handleLike(sermon.id)}>
                👍 {sermon.likes_count} Likes
              </button>
              <Link to={`/edit/${sermon.id}`} className="edit-btn">
                📝 Edit
              </Link>
              <Link to={`/guide/${sermon.id}`} className="rebirth-btn">
                설교의 재탄생
              </Link>
              <button onClick={() => handleDelete(sermon.id, currentUserId)} className="delete-btn">
                🗑️ Delete
              </button>
            </div>
          </div>
        ))
      ) : (
        <p>No sermons found. Please add a sermon using the form above.</p>
      )}
    </div>
  </>
);

function App() {
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSermon, setNewSermon] = useState({ title: '', preacher: '', location: '', content: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserId, setCurrentUserId] = useState('user123');

  useEffect(() => {
    const fetchSermons = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/sermons?query=${searchTerm}`);
        const data = await response.json();
        setSermons(data);
      } catch (error) {
        console.error("Failed to fetch sermons:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSermons();
  }, [searchTerm]);

  const handleLike = async (sermonId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/sermons/${sermonId}/like`, {
        method: 'POST',
      });
      if (response.ok) {
        setSermons(sermons.map(sermon => 
          sermon.id === sermonId ? { ...sermon, likes_count: sermon.likes_count + 1 } : sermon
        ));
      }
    } catch (error) {
      console.error("Failed to update like count:", error);
    }
  };

  const handleDelete = async (sermonId, authorId) => {
    const confirmDelete = window.confirm("정말 이 설교를 삭제하시겠습니까?");
    if (confirmDelete) {
      try {
        const response = await fetch(`http://localhost:5000/api/sermons/${sermonId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ author_id: authorId }),
        });
        if (response.ok) {
          setSermons(sermons.filter(sermon => sermon.id !== sermonId));
        } else if (response.status === 403) {
          alert("삭제 권한이 없습니다.");
        } else {
          console.error("Failed to delete sermon:", response.statusText);
        }
      } catch (error) {
        console.error("Failed to delete sermon:", error);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSermon({ ...newSermon, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/sermons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newSermon,
          ai_generated: false,
          author_id: currentUserId,
        }),
      });
      if (response.ok) {
        const savedSermon = await response.json();
        setSermons([savedSermon, ...sermons]);
        setNewSermon({ title: '', preacher: '', location: '', content: '' });
      } else {
        console.error("Failed to save sermon:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to submit form:", error);
    }
  };

  if (loading) {
    return <div>Loading sermons...</div>;
  }

  return (
    <Router>
      <div className="App">
        <h1>Sermon Archive</h1>
        <Routes>
          <Route path="/" element={<HomePage 
            sermons={sermons} 
            loading={loading}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            handleLike={handleLike}
            handleDelete={handleDelete}
            newSermon={newSermon}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            currentUserId={currentUserId}
          />} />
          <Route path="/guide/:sermonId" element={<SermonGuidePage />} />
          <Route path="/edit/:sermonId" element={<EditSermonPage currentUserId={currentUserId} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;