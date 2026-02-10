'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { feedbackAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  MessageSquare,
  Bug,
  Lightbulb,
  AlertCircle,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  MoreVertical,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface Feedback {
  _id: string;
  type: string;
  subject: string;
  message: string;
  email: string;
  name?: string;
  priority: string;
  status: string;
  createdAt: string;
  adminNotes?: string;
  user?: {
    email: string;
    displayName: string;
  };
}

export default function AdminFeedbackPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', type: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/dashboard');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchFeedback();
    }
  }, [user, filter, page]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const response = await feedbackAPI.getAll({
        page,
        limit: 10,
        status: filter.status,
        type: filter.type,
      });
      setFeedback(response.data.data);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await feedbackAPI.updateStatus(id, { status: newStatus });
      toast.success('Status updated');
      fetchFeedback();
      if (selectedFeedback?._id === id) {
        setSelectedFeedback((prev) => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) return;
    try {
      await feedbackAPI.delete(id);
      toast.success('Feedback deleted');
      fetchFeedback();
      if (selectedFeedback?._id === id) setSelectedFeedback(null);
    } catch (error) {
      toast.error('Failed to delete feedback');
    }
  };

  const handleAddNote = async (id: string) => {
    try {
      await feedbackAPI.updateStatus(id, { status: selectedFeedback?.status || 'pending', adminNotes: adminNote });
      toast.success('Note added');
      fetchFeedback();
      if (selectedFeedback) {
        setSelectedFeedback({ ...selectedFeedback, adminNotes: adminNote });
      }
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug_report':
        return <Bug className="w-4 h-4 text-red-500" />;
      case 'feature_request':
        return <Lightbulb className="w-4 h-4 text-yellow-500" />;
      case 'complaint':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Resolved</span>;
      case 'in_progress':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> In Progress</span>;
      case 'closed':
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Closed</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full flex items-center gap-1 w-fit"><AlertCircle className="w-3 h-3" /> Pending</span>;
    }
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - List */}
      <div className={`w-full md:w-1/3 border-r border-gray-200 bg-white flex flex-col ${selectedFeedback ? 'hidden md:flex' : ''}`}>
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold mb-4">Feedback Inbox</h1>
          <div className="flex gap-2">
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Types</option>
              <option value="feature_request">Feature Requests</option>
              <option value="bug_report">Bug Reports</option>
              <option value="complaint">Complaints</option>
              <option value="general">General</option>
            </select>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          ) : feedback.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No feedback found</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {feedback.map((item) => (
                <div
                  key={item._id}
                  onClick={() => {
                    setSelectedFeedback(item);
                    setAdminNote(item.adminNotes || '');
                  }}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedFeedback?._id === item._id ? 'bg-orange-50 border-l-4 border-orange-500' : ''}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.type)}
                      <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
                        {item.type.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{item.subject}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">{item.message}</p>
                  <div className="flex items-center justify-between">
                    {getStatusBadge(item.status)}
                    {item.priority === 'high' && (
                      <span className="text-xs font-bold text-red-500">High Priority</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200 flex justify-between items-center">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Main Content - Detail View */}
      <div className={`flex-1 flex-col h-screen overflow-hidden ${selectedFeedback ? 'flex' : 'hidden md:flex'}`}>
        {selectedFeedback ? (
          <>
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-start bg-white">
              <div className="flex-1">
                <button 
                  onClick={() => setSelectedFeedback(null)}
                  className="md:hidden text-gray-500 hover:text-gray-900 mb-4"
                >
                  ← Back to list
                </button>
                <div className="flex items-center gap-3 mb-2">
                  {getStatusBadge(selectedFeedback.status)}
                  <span className="text-sm text-gray-500">
                    ID: {selectedFeedback._id.slice(-6)}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedFeedback.subject}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(selectedFeedback.createdAt).toLocaleString()}
                  </span>
                  <span>•</span>
                  <span>{selectedFeedback.email}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(selectedFeedback._id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Feedback"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                    {selectedFeedback.name ? selectedFeedback.name[0].toUpperCase() : selectedFeedback.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{selectedFeedback.name || 'Anonymous'}</p>
                    <p className="text-sm text-gray-500">{selectedFeedback.email}</p>
                  </div>
                </div>
                <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                  {selectedFeedback.message}
                </div>
              </div>

              {/* Admin Actions */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Admin Actions</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Update Status
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['pending', 'in_progress', 'resolved', 'closed'].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusUpdate(selectedFeedback._id, status)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                            selectedFeedback.status === status
                              ? 'bg-gray-900 text-white border-gray-900'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900'
                          }`}
                        >
                          {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Internal Notes
                    </label>
                    <div className="flex gap-2">
                      <textarea
                        value={adminNote}
                        onChange={(e) => setAdminNote(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                        rows={3}
                        placeholder="Add private notes for admins..."
                      />
                      <button
                        onClick={() => handleAddNote(selectedFeedback._id)}
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:opacity-90 transition-opacity self-end"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-100">
                  <a
                    href={`mailto:${selectedFeedback.email}?subject=Re: ${selectedFeedback.subject}`}
                    className="inline-flex items-center gap-2 text-orange-600 font-medium hover:text-orange-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Reply via Email
                  </a>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Select a message to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
