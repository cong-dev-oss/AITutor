import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import Assessment from './pages/Assessment';
import Documents from './pages/Documents';

function App() {
  const token = localStorage.getItem('authToken');

  return (
    <Routes>
      <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!token ? <Register /> : <Navigate to="/" />} />
      
      <Route path="/" element={<Layout />}>
        <Route index element={token ? <Chat /> : <Navigate to="/login" />} />
        <Route path="assessment" element={token ? <Assessment /> : <Navigate to="/login" />} />
        <Route path="documents" element={token ? <Documents /> : <Navigate to="/login" />} />
      </Route>
    </Routes>
  );
}

export default App;
