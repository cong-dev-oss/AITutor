import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { CheckCircle, Loader2, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuestionDto {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export default function Assessment() {
  const [questions, setQuestions] = useState<QuestionDto[] | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [newLevel, setNewLevel] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const { data } = await api.get('/placement-test/generate');
        setQuestions(data);
      } catch (err) {
        console.error('Lỗi khi lấy câu hỏi test.', err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const handleNext = async () => {
    if (questions && selectedOption === questions[currentIdx].correctIndex) {
      setScore(s => s + 1);
    }
    
    setSelectedOption(null);
    if (questions && currentIdx + 1 >= questions.length) {
      await submitResult();
    } else {
      setCurrentIdx(i => i + 1);
    }
  };

  const submitResult = async () => {
    try {
      const currentScore = (questions && selectedOption === questions[currentIdx].correctIndex) ? score + 1 : score;
      const { data } = await api.post('/placement-test/submit', currentScore);
      setNewLevel(data.newLevel || 'A1');
      setIsFinished(true);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !questions) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-muted-foreground bg-background">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="font-medium text-sm">Đang tải biểu mẫu đánh giá...</p>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto py-8">
      <div className="bg-card border border-border shadow-sm p-8 rounded-lg max-w-3xl mx-auto">
        
        {!isFinished ? (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-end mb-8 pb-4 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">Đánh giá Năng lực</h2>
              <span className="text-sm font-medium text-muted-foreground">
                Câu {currentIdx + 1} / {questions.length}
              </span>
            </div>

            <div className="mb-8 p-6 bg-secondary/30 rounded-lg">
              <p className="text-lg text-foreground font-medium leading-relaxed">
                {questions[currentIdx].question}
              </p>
            </div>

            <div className="space-y-3">
              {questions[currentIdx].options.map((opt, idx) => (
                <label 
                  key={idx} 
                  className={`flex items-center p-4 border rounded-md cursor-pointer transition-all duration-200
                    ${selectedOption === idx 
                      ? 'bg-primary/5 border-primary text-foreground font-medium' 
                      : 'border-border hover:bg-secondary/50 text-muted-foreground hover:text-foreground'}
                  `}
                >
                  <input 
                    type="radio" 
                    name="answer"
                    className="hidden"
                    checked={selectedOption === idx}
                    onChange={() => setSelectedOption(idx)} 
                  />
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-4 flex-shrink-0 transition-colors
                    ${selectedOption === idx ? 'border-primary' : 'border-muted-foreground/50'}
                  `}>
                    {selectedOption === idx && <div className="w-2.5 h-2.5 bg-primary rounded-full" />}
                  </div>
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleNext}
                disabled={selectedOption === null}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {currentIdx + 1 >= questions.length ? 'Hoàn thành bài thi' : 'Tiếp tục'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 animate-in fade-in zoom-in duration-500">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-4">Đánh giá thành công</h2>
            <p className="text-muted-foreground mb-10 text-sm">Hệ thống đã cập nhật lộ trình học tập cá nhân hóa cho bạn.</p>
            
            <div className="inline-block border border-border rounded-lg px-12 py-6 mb-10 bg-secondary/30">
              <p className="text-sm font-medium text-muted-foreground mb-2">Trình độ tương đương</p>
              <p className="text-4xl font-bold text-foreground">{newLevel}</p>
            </div>

            <div>
              <button 
                onClick={() => navigate('/')}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-md text-sm font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 mx-auto active:scale-[0.98]"
              >
                <BookOpen className="w-4 h-4" /> Bắt đầu luyện tập
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
