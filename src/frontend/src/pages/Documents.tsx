import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import * as signalR from '@microsoft/signalr';
import { FileUp, FileText, CheckCircle, Clock, Link as LinkIcon, Search, Image as ImageIcon, Trash2, Eye, X } from 'lucide-react';

interface DocumentModel {
  id: string;
  fileName: string;
  topic: string;
  difficulty: string;
  isProcessed: boolean;
  uploadedAt: string;
  type?: string;
}

export default function Documents() {
  const [documents, setDocuments] = useState<DocumentModel[]>([]);
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState<{title: string, description: string, image: string} | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [viewingDoc, setViewingDoc] = useState<{id: string, title: string, content: string} | null>(null);
  const [viewingLoading, setViewingLoading] = useState(false);

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

    // SignalR for Upload Progress
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl("http://localhost:5154/hubs/chat", {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    connection.on("UploadProgress", (docId: string, percentage: number) => {
      setProgressMap(prev => ({ ...prev, [docId]: percentage }));
      if (percentage === 100) {
        setTimeout(() => fetchDocs(), 1000);
      }
    });

    connection.start().catch(err => console.error("SignalR Connection Error: ", err));

    return () => {
      connection.stop();
    };
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
      const { data } = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTopic('');
      await fetchDocs();
    } catch (err) {
      console.error('Lỗi khi tải lên file.', err);
      alert('Tải lên thất bại');
      setUploading(false);
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = async () => {
    if (!url.trim()) return;
    setPreviewing(true);
    setPreview(null);
    try {
      const { data } = await api.get(`/documents/preview-url?url=${encodeURIComponent(url)}`);
      setPreview(data);
    } catch (err) {
      console.error(err);
      alert('Không thể tải preview từ URL.');
    } finally {
      setPreviewing(false);
    }
  };

  const handleSaveUrl = async () => {
    if (!topic.trim()) {
      alert("Vui lòng nhập chủ đề trước.");
      return;
    }
    if (!url.trim()) return;
    setUploading(true);
    try {
      await api.post('/documents/url', { url, topic, difficulty });
      setTopic('');
      setUrl('');
      setPreview(null);
      await fetchDocs();
    } catch (err: any) {
      console.error('Lỗi khi tải URL.', err);
      const details = err.response?.data?.details || err.message;
      alert(`Tải từ Link thất bại: ${details}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa tài liệu này? Mọi dữ liệu liên quan sẽ bị xóa sạch khỏi hệ thống.")) return;
    
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error(err);
      alert("Xóa thất bại");
    }
  };

  const handleViewDetails = async (id: string, title: string) => {
    setViewingLoading(true);
    setViewingDoc({ id, title, content: '' });
    try {
      const { data } = await api.get(`/documents/${id}/content`);
      setViewingDoc({ id, title, content: data.content });
    } catch (err) {
      console.error(err);
      alert("Không thể tải nội dung");
      setViewingDoc(null);
    } finally {
      setViewingLoading(false);
    }
  };

  return (
    <div className="py-8 w-full mx-auto animate-in fade-in duration-500">
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
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FileUp className="w-5 h-5" /> Thêm tài liệu
            </h2>

            <div className="flex bg-secondary/30 p-1 rounded-lg mb-6">
              <button 
                onClick={() => setUploadMode('file')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${uploadMode === 'file' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <FileUp className="w-4 h-4" /> File PDF
              </button>
              <button 
                onClick={() => setUploadMode('url')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${uploadMode === 'url' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <LinkIcon className="w-4 h-4" /> Từ Link
              </button>
            </div>
            
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

              {uploadMode === 'file' ? (
                <div className="pt-4">
                  <label className={`
                    flex items-center justify-center p-4 border-2 border-dashed border-border rounded-md cursor-pointer whitespace-nowrap text-sm font-medium transition-all duration-200
                    ${uploading ? 'bg-secondary/50 opacity-50 cursor-not-allowed' : 'hover:bg-secondary/50 hover:border-primary/50 text-foreground'}
                  `}>
                    <FileText className="w-4 h-4 mr-2" />
                    {uploading ? 'Đang gửi file...' : 'Chọn File PDF'}
                    <input 
                      type="file" 
                      accept=".pdf" 
                      onChange={handleUpload}
                      disabled={uploading}
                      className="hidden" 
                    />
                  </label>
                </div>
              ) : (
                <div className="pt-4 space-y-4">
                  <div className="flex gap-2">
                    <input 
                      type="url" 
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com/article"
                      className="flex-1 border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded-md transition-colors"
                    />
                    <button 
                      onClick={handlePreview}
                      disabled={previewing || !url.trim()}
                      className="px-3 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium hover:bg-secondary/80 disabled:opacity-50 transition-all flex items-center gap-2"
                    >
                      {previewing ? <Clock className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      Xem
                    </button>
                  </div>
                  
                  {preview && (
                    <div className="border border-border rounded-md overflow-hidden bg-background animate-in fade-in slide-in-from-top-2 duration-300">
                      {preview.image ? (
                        <div className="w-full h-32 bg-secondary/50 border-b border-border">
                          <img src={preview.image} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-full h-24 bg-secondary/30 border-b border-border flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="p-3">
                        <h3 className="font-semibold text-sm line-clamp-1 mb-1" title={preview.title}>{preview.title || 'No Title'}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">{preview.description}</p>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={handleSaveUrl}
                    disabled={uploading || !preview}
                    className="w-full py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {uploading ? 'Đang gửi yêu cầu...' : 'Lưu vào Thư viện'}
                  </button>
                </div>
              )}
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
                      <th className="px-6 py-4 text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">
                          <div className="flex items-center">
                            {doc.type === 'URL' || doc.fileName.startsWith('http') ? <LinkIcon className="w-4 h-4 mr-3 text-muted-foreground" /> : <FileText className="w-4 h-4 mr-3 text-muted-foreground" />}
                            <span className="line-clamp-1 max-w-[180px]" title={doc.fileName}>{doc.fileName}</span>
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
                            <div className="flex flex-col items-center gap-1">
                               <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                                <Clock className="w-3 h-3 animate-pulse" /> Đang xử lý
                              </span>
                              {progressMap[doc.id] !== undefined && (
                                <div className="w-20 h-1 bg-secondary rounded-full overflow-hidden mt-1">
                                  <div 
                                    className="h-full bg-amber-500 transition-all duration-300" 
                                    style={{ width: `${progressMap[doc.id]}%` }}
                                  />
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                             <button 
                              onClick={() => handleViewDetails(doc.id, doc.fileName)}
                              className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(doc.id)}
                              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                              title="Xóa tài liệu"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          )}
        </div>
      </div>

      {/* Viewing Details Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-card border border-border w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div>
                  <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" /> {viewingDoc.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Nội dung đã được xử lý và lưu trữ véc-tơ</p>
                </div>
                <button 
                  onClick={() => setViewingDoc(null)}
                  className="p-2 hover:bg-secondary rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 md:p-10">
                {viewingLoading ? (
                  <div className="h-40 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Đang tải nội dung...</p>
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-base leading-loose whitespace-pre-wrap text-foreground/90 font-medium">
                      {viewingDoc.content}
                    </p>
                  </div>
                )}
              </div>
              <div className="p-4 bg-secondary/30 border-t border-border flex justify-end">
                <button 
                  onClick={() => setViewingDoc(null)}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 shadow-md transition-all active:scale-95"
                >
                  Đóng
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
