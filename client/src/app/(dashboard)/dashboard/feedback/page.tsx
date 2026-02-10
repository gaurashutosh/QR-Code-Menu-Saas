'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { feedbackAPI } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  MessageSquare,
  Bug,
  Lightbulb,
  AlertCircle,
  HelpCircle,
  Send,
  Loader2,
} from 'lucide-react';

export default function FeedbackPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'general',
    subject: '',
    message: '',
    email: user?.email || '',
    name: user?.displayName || '',
    priority: 'medium',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await feedbackAPI.create(formData);
      toast.success('Feedback submitted successfully!');
      setFormData({
        type: 'general',
        subject: '',
        message: '',
        email: user?.email || '',
        name: user?.displayName || '',
        priority: 'medium',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug_report':
        return <Bug className="w-5 h-5 text-red-500" />;
      case 'feature_request':
        return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      case 'complaint':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'suggestion':
        return <HelpCircle className="w-5 h-5 text-green-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            We Value Your Feedback
          </h1>
          <p className="text-gray-600">
            Help us improve your experience. Whether it's a feature request, bug report, or general feedback, we're all ears!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name (Optional)
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Feedback Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors appearance-none"
                >
                  <option value="general">General Feedback</option>
                  <option value="feature_request">Feature Request</option>
                  <option value="bug_report">Bug Report</option>
                  <option value="complaint">Complaint</option>
                  <option value="suggestion">Suggestion</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {getTypeIcon(formData.type)}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="subject"
              required
              value={formData.subject}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
              placeholder="Brief summary of your feedback"
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              name="message"
              required
              value={formData.message}
              onChange={handleChange}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors resize-none"
              placeholder="Please describe your feedback in detail..."
              maxLength={2000}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {formData.message.length}/2000 characters
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-gray-600">
        <div className="p-4 bg-white/50 rounded-xl border border-gray-100">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-semibold mb-1">We Listen</h3>
          <p className="text-sm">Every message is read by our team within 24 hours.</p>
        </div>
        <div className="p-4 bg-white/50 rounded-xl border border-gray-100">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lightbulb className="w-5 h-5 text-yellow-600" />
          </div>
          <h3 className="font-semibold mb-1">We Improve</h3>
          <p className="text-sm">Your ideas help shape the future of our platform.</p>
        </div>
        <div className="p-4 bg-white/50 rounded-xl border border-gray-100">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Bug className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="font-semibold mb-1">We Fix</h3>
          <p className="text-sm">Found a bug? We'll prioritize fixing it ASAP.</p>
        </div>
      </div>
    </div>
  );
}
