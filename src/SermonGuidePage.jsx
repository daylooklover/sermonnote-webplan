import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function SermonGuidePage() {
  const { sermonId } = useParams();
  const navigate = useNavigate();
  const [sermon, setSermon] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [fontSize, setFontSize] = useState(16);

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
      }
    };
    fetchSermon();
  }, [sermonId]);

  const handleMaterialChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSelectedMaterials([...selectedMaterials, value]);
    } else {
      setSelectedMaterials(selectedMaterials.filter(m => m !== value));
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleSubmit = async () => {
    const dataToSend = {
      sermonId: sermonId,
      originalSermonText: sermon.content,
      sermonStyle: selectedStyle,
      additionalMaterials: selectedMaterials,
    };
    
    console.log("AI 길잡이에게 보낼 데이터:", dataToSend);
    alert("AI 길잡이에게 요청을 보냈습니다! (실제 기능 준비 중...)");
    navigate('/');
  };

  // 폰트 크기 조절 함수
  const handleZoomIn = () => {
    setFontSize(prevSize => prevSize + 2);
  };

  const handleZoomOut = () => {
    setFontSize(prevSize => (prevSize > 10 ? prevSize - 2 : 10));
  };


  if (!sermon) {
    return <div>Loading...</div>;
  }

  return (
    <div className="sermon-guide-page">
      <div className="guide-header">
        <button className="back-btn" onClick={handleBack}>
          ← 이전으로
        </button>
      </div>

      <h2>설교의 재탄생: AI 길잡이</h2>
      <div className="guide-card">
        <div className="card-header">
          <h3>원문 설교: {sermon.title}</h3>
          <div className="zoom-controls">
            <button onClick={handleZoomOut}>A-</button>
            <button onClick={handleZoomIn}>A+</button>
          </div>
        </div>
        <p style={{ fontSize: `${fontSize}px` }}>{sermon.content}</p>
      </div>

      <div className="options-section">
        <h3>1. 설교 스타일 선택</h3>
        <div className="style-options">
          <button 
            className={`style-btn ${selectedStyle === '주제 중심' ? 'selected' : ''}`}
            onClick={() => setSelectedStyle('주제 중심')}
          >
            주제 중심
          </button>
          <button 
            className={`style-btn ${selectedStyle === '본문 중심' ? 'selected' : ''}`}
            onClick={() => setSelectedStyle('본문 중심')}
          >
            본문 중심
          </button>
          <button 
            className={`style-btn ${selectedStyle === '이야기 중심' ? 'selected' : ''}`}
            onClick={() => setSelectedStyle('이야기 중심')}
          >
            이야기 중심
          </button>
        </div>
      </div>
      
      <div className="options-section">
        <h3>2. 추가할 자료 선택</h3>
        <div className="materials-options">
          <label>
            <input type="checkbox" value="역사적 배경" onChange={handleMaterialChange} /> 역사적 배경
          </label>
          <label>
            <input type="checkbox" value="신학자 견해" onChange={handleMaterialChange} /> 신학자 견해
          </label>
          <label>
            <input type="checkbox" value="관련 성경 구절" onChange={handleMaterialChange} /> 관련 성경 구절
          </label>
        </div>
      </div>

      <div className="action-section">
        <button 
          className="create-btn" 
          disabled={!selectedStyle}
          onClick={handleSubmit}
        >
          AI 길잡이에게 맡기기
        </button>
      </div>
    </div>
  );
}

export default SermonGuidePage;