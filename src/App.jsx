// src/App.jsx
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Forum from './components/Forum';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Register from './components/Register';
import Thread from './components/Thread';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Navbar />
          <Routes>
            <Route path="/" element={<Forum />} />
            <Route path="/thread/:id" element={<Thread />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;