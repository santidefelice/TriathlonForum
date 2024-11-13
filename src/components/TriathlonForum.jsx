// src/components/Forum.jsx
import { Clock, MessageSquare, ThumbsUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
//import './Forum.css';

const Forum = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [threads, setThreads] = useState([]);
  const [newThread, setNewThread] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchThreads(selectedCategory);
    }
  }, [selectedCategory]);

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error.message);
    }
  }

  async function fetchThreads(categorySlug) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('threads')
        .select(`
          *,
          profiles:author_id(username),
          replies:replies(count),
          likes:likes(count)
        `)
        .eq('category_id', categorySlug)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setThreads(data);
    } catch (error) {
      console.error('Error fetching threads:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateThread(e) {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('threads')
        .insert([
          {
            title: newThread.title,
            content: newThread.content,
            category_id: selectedCategory,
            author_id: user.id,
          },
        ])
        .select();

      if (error) throw error;
      
      setNewThread({ title: '', content: '' });
      fetchThreads(selectedCategory);
    } catch (error) {
      console.error('Error creating thread:', error.message);
    }
  }

  async function handleLike(threadId) {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('likes')
        .insert([
          {
            thread_id: threadId,
            user_id: user.id,
          },
        ]);

      if (error) throw error;
      fetchThreads(selectedCategory);
    } catch (error) {
      console.error('Error liking thread:', error.message);
    }
  }

  return (
    <div className="forum-container">
      <div className="forum-card">
        <div className="forum-content">
          <div className="category-buttons">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.slug)}
                className={`category-button ${
                  selectedCategory === category.slug ? 'active' : ''
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {user && (
            <form onSubmit={handleCreateThread} className="new-thread-form">
              <input
                type="text"
                placeholder="Thread title"
                value={newThread.title}
                onChange={(e) => setNewThread({ ...newThread, title: e.target.value })}
                required
              />
              <textarea
                placeholder="Thread content"
                value={newThread.content}
                onChange={(e) => setNewThread({ ...newThread, content: e.target.value })}
                required
              />
              <button type="submit">Create Thread</button>
            </form>
          )}

          <div className="thread-list">
            {loading ? (
              <div className="loading">Loading...</div>
            ) : threads.length === 0 ? (
              <div className="empty-state">
                No threads in this category yet. Be the first to post!
              </div>
            ) : (
              threads.map((thread) => (
                <div 
                  key={thread.id} 
                  className="thread-card"
                  onClick={() => navigate(`/thread/${thread.id}`)}
                >
                  <div className="thread-content">
                    <div className="thread-main">
                      <h3 className="thread-title">{thread.title}</h3>
                      <p className="thread-author">
                        Posted by {thread.profiles.username}
                      </p>
                      <p className="thread-preview">{thread.content}</p>
                    </div>
                    <div className="thread-stats">
                      <div className="stat">
                        <MessageSquare className="icon" />
                        <span>{thread.replies.count}</span>
                      </div>
                      <button
                        className="stat like-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(thread.id);
                        }}
                      >
                        <ThumbsUp className="icon" />
                        <span>{thread.likes.count}</span>
                      </button>
                      <div className="stat">
                        <Clock className="icon" />
                        <span>
                          {new Date(thread.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forum;