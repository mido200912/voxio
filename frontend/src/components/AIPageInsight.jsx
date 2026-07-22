import React, { useState } from 'react';
import axios from 'axios';
import { useLanguage } from "../context/LanguageContext";
import './AIPageInsight.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

const AIPageInsight = ({ pageName, dataContext }) => {
  const { isArabic } = useLanguage();
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInsight = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${BACKEND_URL}/copilot/page-insight`, 
        { page: pageName, dataContext },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setInsight(res.data.reply);
    } catch (err) {
      console.error('Insight Error:', err);
      setError(isArabic ? 'حدث خطأ أثناء جلب التحليل.' : 'Failed to fetch insights.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`ai-page-insight ${isArabic ? 'rtl' : 'ltr'}`}>
      <button 
        className="insight-trigger-btn" 
        onClick={fetchInsight} 
        disabled={loading}
      >
        <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-magic'}`}></i>
        <span>{isArabic ? 'تحليل الصفحة بالذكاء الاصطناعي' : 'AI Page Insight'}</span>
      </button>

      {insight && (
        <div className="insight-result">
          <div className="insight-result-header">
            <i className="fas fa-robot"></i>
            <span>{isArabic ? 'رؤى الذكاء الاصطناعي' : 'AI Insights'}</span>
            <button className="insight-close" onClick={() => setInsight('')}>
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="insight-result-body">
            {insight.split('\n').map((line, idx) => (
              <p key={idx}>{line}</p>
            ))}
          </div>
        </div>
      )}

      {error && <div className="insight-error">{error}</div>}
    </div>
  );
};

export default AIPageInsight;
