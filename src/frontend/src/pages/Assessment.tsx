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
      <div className="flex flex-col items-center justify-center h-[70vh] text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="font-serif italic font-semibold">Tutor đang soạn bài thi từ tài liệu của bạn...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-card border border-border/80 shadow-sm p-8 max-w-2xl mx-auto rounded-sm">
        
        {!isFinished ? (
          <div className="animate-in fade-in duration-500">
            <div className="text-center mb-8 pb-6 border-b border-border/50">
              <h2 className="text-2xl font-serif text-primary italic font-bold">Kiểm Tra Trình Độ</h2>
              <p className="text-muted-foreground mt-2 text-sm uppercase tracking-widest">
                Câu {currentIdx + 1} / {questions.length}
              </p>
            </div>

            <div className="bg-[#f0ece1] p-6 lg:p-8 rounded-sm mb-6 border border-[#e6dfd1] shadow-inner">
              <p className="text-lg text-primary font-medium leading-relaxed">
                {questions[currentIdx].question}
              </p>
            </div>

            <div className="space-y-3">
              {questions[currentIdx].options.map((opt, idx) => (
                <label 
                  key={idx} 
                  className={`flex items-center p-4 border rounded-sm cursor-pointer transition-colors
                    ${selectedOption === idx 
                      ? 'bg-stone-200/50 border-primary border-l-4 text-primary font-medium' 
                      : 'border-border hover:bg-stone-50 text-muted-foreground hover:text-primary'}
                  `}
                >
                  <input 
                    type="radio" 
                    name="answer"
                    className="hidden"
                    checked={selectedOption === idx}
                    onChange={() => setSelectedOption(idx)} 
                  />
                  <span className="w-8 h-8 rounded-full flex items-center justify-center border border-current mr-4 text-sm flex-shrink-0 opacity-70">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </label>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleNext}
                disabled={selectedOption === null}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {currentIdx + 1 >= questions.length ? 'Hoàn thành' : 'Câu tiếp theo'}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl font-serif text-primary italic font-bold mb-4">Chúc mừng!</h2>
            <p className="text-muted-foreground mb-6">Bạn đã hoàn thành bài kiểm tra đầu vào.</p>
            
            <div className="inline-block border-2 border-primary/20 px-8 py-4 mb-8 bg-[#fdfbf7]">
              <p className="text-sm uppercase tracking-widest text-muted-foreground mb-1">Trình độ đề xuất</p>
              <p className="text-4xl font-serif text-primary font-bold">{newLevel}</p>
            </div>

            <div>
              <button 
                onClick={() => navigate('/')}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-sm font-medium hover:bg-primary/90 shadow-inner flex items-center justify-center gap-2 mx-auto"
              >
                <BookOpen className="w-5 h-5" /> Bắt đầu khóa học
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
