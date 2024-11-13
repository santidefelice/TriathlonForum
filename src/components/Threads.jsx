// src/components/Thread.jsx
import { ArrowLeft, Clock, MessageSquare, ThumbsUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import './Threads.css';

const Thread = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [thread, setThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchThread();
    fetchReplies();
  }, [id]);

  async function fetchThread() {
    try {
      const { data, error } = await supabase
        .from('threads')
        .select(`
          *,
          profiles:author_id(username),
          likes:likes(count),
          categories:category_id(name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setThread(data);
    } catch (error) {
      setError('Thread not found');
      console.error('Error fetching thread:', error.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchReplies() {
    try {
      const { data, error } = await supabase
        .from('replies')
        .select(`
          *,
          profiles:author_id(username)
        `)
        .eq('thread_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setReplies(data);
    } catch (error) {
      console.error('Error fetching replies:', error.message);
    }
  }

  async function handleLike() {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const { data: existingLike } = await supabase
        .from('likes')
        .select()
        .eq('thread_id', id)
        .eq('user_id', user.id)
        .single();

      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('thread_id', id)
          .eq('user_id', user.id);
      } else {
        // Like
        await supabase
          .from('likes')
          .insert([{ thread_id: id, user_id: user.id }]);
      }

      fetchThread();
    } catch (error) {
      console.error('Error handling like:', error.message);
    }
  }

  async function handleReply(e) {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const { error } = await supabase
        .from('replies')
        .insert([
          {
            content: newReply,
            thread_id: id,
            author_id: user.id
          }
        ]);

      if (error) throw error;

      setNewReply('');
      fetchReplies();
    } catch (error) {
      console.error('Error posting reply:', error.message);
    }
  }

  if (loading) {
    return <div className="thread-loading">Loading...</div>;
  }

  if (error) {
    return <div className="thread-error">{error}</div>;
  }

  return (
    <div className="thread-container">
      <button onClick={() => navigate(-1)} className="back-button">
        <ArrowLeft size={20} />
        Back to Forum
      </button>

      {thread && (
        <div className="thread-content">
          <div className="thread-header">
            <div className="thread-category">{thread.categories.name}</div>
            <h1 className="thread-title">{thread.title}</h1>
            <div className="thread-meta">
              <span className="thread-author">Posted by {thread.profiles.username}</span>
              <span className="thread-date">
                <Clock size={16} />
                {new Date(thread.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="thread-body">
            <p>{thread.content}</p>
          </div>

          <div className="thread-actions">
            <button 
              className={`like-button ${thread.user_has_liked ? 'liked' : ''}`}
              onClick={handleLike}
            >
              <ThumbsUp size={20} />
              <span>{thread.likes.count}</span>
            </button>
            <div className="reply-count">
              <MessageSquare size={20} />
              <span>{replies.length} replies</span>
            </div>
          </div>

          <div className="replies-section">
            <h2>Replies</h2>
            
            {user && (
              <form onSubmit={handleReply} className="reply-form">
                <textarea
                  value={newReply}
                  onChange={(e) => setNewReply(e.target.value)}
                  placeholder="Write your reply..."
                  required
                />
                <button type="submit">Post Reply</button>
              </form>
            )}

            <div className="replies-list">
              {replies.map((reply) => (
                <div key={reply.id} className="reply-card">
                  <div className="reply-header">
                    <span className="reply-author">{reply.profiles.username}</span>
                    <span className="reply-date">
                      {new Date(reply.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="reply-content">
                    {reply.content}
                  </div>
                </div>
              ))}
              
              {replies.length === 0 && (
                <div className="no-replies">
                  No replies yet. Be the first to reply!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Thread;