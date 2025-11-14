import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function EditSermonPage({ onUpdate }) {
  const { sermonId } = useParams();
  const navigate = useNavigate();
  const [sermon, setSermon] = useState({ title: '', preacher: '', location: '', content: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 조회수 API 호출
    const updateViews = async () => {
      try {
        await fetch(`http://localhost:5000/api/sermons/${sermonId}/view`, {
          method: 'POST'
        });
      } catch (error) {
        console.error("Failed to update view count:", error);
      }
    };
    updateViews();

    // 설교 데이터 가져오기
    const fetchSermon = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/sermons/${sermonId}`);
        const data = await response.json();
        setSermon(data);
      } catch (error) {
        console.error("Failed to fetch sermon for editing:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSermon();
  }, [sermonId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSermon({ ...sermon, [name]: value });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/sermons/${sermonId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sermon),
      });
      if (response.ok) {
        alert("설교가 성공적으로 수정되었습니다!");
        navigate('/');
      } else {
        console.error("Failed to update sermon:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to update sermon:", error);
    }
  };

  if (loading) {
    return <div>Loading sermon for editing...</div>;
  }

  return (
    <div className="edit-page">
      <h2>설교 수정하기</h2>
      <form onSubmit={handleUpdate} className="sermon-form-container">
        <div className="form-group">
          <label htmlFor="sermon-title">설교 제목</label>
          <input
            id="sermon-title"
            type="text"
            name="title"
            placeholder="Sermon Title"
            value={sermon.title}
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
            placeholder="Preacher"
            value={sermon.preacher}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="sermon-location">설교 장소</label>
          <input
            id="sermon-location"
            type="text"
            name="location"
            placeholder="Location"
            value={sermon.location}
            onChange={handleInputChange}
          />
        </div>
        <div className="form-group">
          <label htmlFor="sermon-content">설교 내용</label>
          <textarea
            id="sermon-content"
            name="content"
            placeholder="Sermon Content"
            value={sermon.content}
            onChange={handleInputChange}
            required
          ></textarea>
        </div>
        <button type="submit" className="add-sermon-btn">수정 완료</button>
      </form>
    </div>
  );
}

export default EditSermonPage;