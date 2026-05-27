import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit2, Trash2, Mic } from 'lucide-react';
import { moodEmojis, type JournalEntry } from '../../../types/journal';

const mockEntry: JournalEntry = {
  id: '1',
  user_id: 'user1',
  title: 'Grateful for small things',
  content: 'My friend sent me a random text today saying they were thinking of me.',
  mood: 'grateful',
  voice_url: null,
  voice_duration: null,
  is_mask_off: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const moodColorMap: Record<string, string> = {
  happy: 'bg-yellow-100 text-yellow-800',
  calm: 'bg-blue-100 text-blue-800',
  grateful: 'bg-green-100 text-green-800',
  anxious: 'bg-purple-100 text-purple-800',
  sad: 'bg-indigo-100 text-indigo-800',
  angry: 'bg-red-100 text-red-800',
  confused: 'bg-orange-100 text-orange-800',
  hopeful: 'bg-teal-100 text-teal-800',
  tired: 'bg-gray-100 text-gray-800',
  neutral: 'bg-slate-100 text-slate-800',
};

export function EntryDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [entry, setEntry] = useState<JournalEntry>(mockEntry);
  const [editedTitle, setEditedTitle] = useState(entry.title || '');
  const [editedContent, setEditedContent] = useState(entry.content || '');

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this entry?')) {
      console.log('Delete entry:', id);
      navigate('/');
    }
  };

  const handleSaveEdit = () => {
    setEntry({ ...entry, title: editedTitle, content: editedContent, updated_at: new Date().toISOString() });
    setIsEditing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md dark:border-slate-700 border-b border-gray-100 sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="smooth-press p-2 hover:bg-purple-50 dark:hover:bg-purple-900/50 rounded-full">
            <ArrowLeft className="w-5 h-5 text-purple-600" />
          </button>
          <h2 className="font-serif text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {isEditing ? 'Edit Entry' : 'Entry Detail'}
          </h2>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <button onClick={() => setIsEditing(true)} className="smooth-press p-2 hover:bg-purple-50 dark:hover:bg-purple-900/50 rounded-full">
                  <Edit2 className="w-5 h-5 text-purple-600" />
                </button>
                <button onClick={handleDelete} className="smooth-press p-2 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-full">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </button>
              </>
            ) : (
              <>
                <button onClick={handleSaveEdit} className="smooth-press px-4 py-1.5 bg-green-500 text-white rounded-full text-sm shadow-sm hover:bg-green-600 hover:shadow-md">Save</button>
                <button onClick={() => setIsEditing(false)} className="smooth-press px-4 py-1.5 bg-gray-300 text-gray-700 rounded-full text-sm shadow-sm hover:bg-gray-200">Cancel</button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          {!isEditing ? (
            <motion.div
              key="view"
              initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              {entry.mood && (
                <div className="flex justify-start">
                  <span className={`smooth-card px-3 py-1 rounded-full text-sm flex items-center gap-1 ${moodColorMap[entry.mood]}`}>
                    <span>{moodEmojis[entry.mood]}</span>
                    <span className="capitalize">{entry.mood}</span>
                  </span>
                </div>
              )}
              <h1 className="text-3xl font-serif font-bold text-gray-800 dark:text-slate-100">{entry.title || 'Untitled'}</h1>
              <p className="text-sm text-gray-400 dark:text-slate-400">{formatDate(entry.created_at)}</p>
              {entry.voice_url && (
                <div className="smooth-card bg-purple-50 dark:bg-purple-900/70 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Mic className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-600">Voice Note</span>
                  </div>
                  <audio src={entry.voice_url} controls className="w-full" />
                </div>
              )}
              <p className="text-gray-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
            </motion.div>
          ) : (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(3px)' }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-6"
            >
              <input type="text" value={editedTitle} onChange={(e) => setEditedTitle(e.target.value)} className="smooth-field w-full text-3xl font-serif font-bold bg-transparent border-b-2 border-purple-200 dark:border-purple-700 py-2 focus:outline-none focus:border-purple-500" placeholder="Title" />
              <textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} rows={12} className="smooth-field w-full p-4 bg-white dark:bg-slate-800 rounded-xl border border-purple-100 dark:border-purple-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:bg-slate-800 resize-none text-slate-950 dark:text-slate-100" placeholder="Write your thoughts here..." />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
