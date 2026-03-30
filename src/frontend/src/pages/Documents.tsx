import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { FileUp, FileText, CheckCircle, Clock } from 'lucide-react';

interface DocumentModel {
  id: string;
  fileName: string;
  topic: string;
  difficulty: string;
  isProcessed: boolean;
  uploadedAt: string;
}

export default function Documents() {
  const [documents, setDocuments] = useState<DocumentModel[]>([]);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/documents');
      setDocuments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    if (!topic.trim()) {
      alert("Vui lòng nhập chủ đề trước.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('topic', topic);
    formData.append('difficulty', difficulty);

    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTopic('');
      await fetchDocs();
    } catch (err) {
      console.error('Lỗi khi tải lên file.', err);
      alert('Tải lên thất bại');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="py-8 w-full mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Thư viện Tài liệu</h1>
          <p className="text-sm text-muted-foreground mt-1">Quản lý các tài liệu nền tảng cho AI Tutor</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Form */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border p-6 rounded-lg shadow-sm sticky top-6">
            <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <FileUp className="w-5 h-5" /> Tải lên tài liệu mới
            </h2>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Chủ đề (VD: Grammar)
                </label>
                <input 
                  type="text" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-md transition-colors"
                  placeholder="Nhập tên bài học..."
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">
                  Độ khó
                </label>
                <select 
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-md transition-colors"
                >
                  <option value="Beginner">Cơ bản (A1-A2)</option>
                  <option value="Intermediate">Trung cấp (B1-B2)</option>
                  <option value="Advanced">Nâng cao (C1-C2)</option>
                </select>
              </div>

              <div className="pt-4">
                <label className={`
                  flex items-center justify-center p-4 border-2 border-dashed border-border rounded-md cursor-pointer whitespace-nowrap text-sm font-medium transition-all duration-200
                  ${uploading ? 'bg-secondary/50 opacity-50 cursor-not-allowed' : 'hover:bg-secondary/50 hover:border-primary/50 text-foreground'}
                `}>
                  <FileText className="w-4 h-4 mr-2" />
                  {uploading ? 'Đang tải lên...' : 'Chọn File PDF'}
                  <input 
                    type="file" 
                    accept=".pdf" 
                    onChange={handleUpload}
                    disabled={uploading}
                    className="hidden" 
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Document List */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
             <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                <div className="w-6 h-6 border-2 border-primary/50 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium">Đang tải danh sách...</p>
             </div>
          ) : documents.length === 0 ? (
            <div className="bg-card border border-border border-dashed p-12 text-center rounded-lg">
               <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
               <p className="text-muted-foreground text-sm font-medium">Chưa có tài liệu nào</p>
            </div>
          ) : (
             <div className="bg-card border border-border rounded-lg overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                  <thead className="bg-secondary/50 border-b border-border text-muted-foreground font-medium text-xs uppercase">
                    <tr>
                      <th className="px-6 py-4">Tên Tài Liệu</th>
                      <th className="px-6 py-4">Chủ đề</th>
                      <th className="px-6 py-4 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-3 text-muted-foreground" />
                            {doc.fileName}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 ml-7">
                            {new Date(doc.uploadedAt).toLocaleDateString('vi-VN')}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {doc.topic} <span className="text-[10px] uppercase ml-1 opacity-70">({doc.difficulty})</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {doc.isProcessed ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                              <CheckCircle className="w-3 h-3" /> Sẵn sàng
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                              <Clock className="w-3 h-3" /> Đang xử lý
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
