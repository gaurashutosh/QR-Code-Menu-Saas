'use client';

import { useState, useEffect } from 'react';
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
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';

export default function SupportFeedback() {
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

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || prev.email,
        name: user.displayName || prev.name
      }));
    }
  }, [user]);

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
    <div className="space-y-6 animate-fade-in">
       <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Help & Support</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Get help or share your thoughts with us.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Send us a message</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                We typically respond within 24 hours.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Your Name (Optional)"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="dark:bg-zinc-950 dark:border-gray-800 dark:text-white"
                />

                <Input
                  label="Email Address *"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className="dark:bg-zinc-950 dark:border-gray-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="feedback-type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Feedback Type *
                    </label>
                    <div className="relative">
                      <select
                        id="feedback-type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none h-[44px] text-gray-900 dark:text-white"
                      >
                        <option value="general" className="bg-white dark:bg-zinc-950">General Feedback</option>
                        <option value="feature_request" className="bg-white dark:bg-zinc-950">Feature Request</option>
                        <option value="bug_report" className="bg-white dark:bg-zinc-950">Bug Report</option>
                        <option value="complaint" className="bg-white dark:bg-zinc-950">Complaint</option>
                        <option value="suggestion" className="bg-white dark:bg-zinc-950">Suggestion</option>
                      </select>
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        {getTypeIcon(formData.type)}
                      </div>
                    </div>
                 </div>

                 <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Priority
                    </label>
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-white dark:bg-zinc-950 border border-gray-300 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 h-[44px] text-gray-900 dark:text-white"
                    >
                      <option value="low" className="bg-white dark:bg-zinc-950">Low</option>
                      <option value="medium" className="bg-white dark:bg-zinc-950">Medium</option>
                      <option value="high" className="bg-white dark:bg-zinc-950">High</option>
                    </select>
                 </div>
              </div>

              <Input
                label="Subject *"
                name="subject"
                required
                value={formData.subject}
                onChange={handleChange}
                placeholder="What is this regarding?"
                maxLength={200}
                className="dark:bg-zinc-950 dark:border-gray-800 dark:text-white"
              />

              <div>
                <Textarea
                  label="Message *"
                  name="message"
                  required
                  value={formData.message}
                  onChange={handleChange}
                  rows={5}
                  placeholder="How can we help you? Please provide as much detail as possible..."
                  maxLength={2000}
                  className="dark:bg-zinc-950 dark:border-gray-800 dark:text-white"
                />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
                  {formData.message.length}/2000 characters
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  loading={loading}
                  className="w-full sm:w-auto min-w-[160px] min-h-[44px]"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          <div className="bg-orange-50/50 dark:bg-orange-950/20 rounded-2xl border border-orange-100 dark:border-orange-900/30 p-6">
             <h3 className="font-semibold text-orange-900 dark:text-orange-400 mb-4 flex items-center gap-2">
                <Mail className="w-5 h-5" /> Direct Contact
             </h3>
             <p className="text-sm text-orange-800/80 dark:text-orange-300/80 mb-4">
               Need urgent assistance? You can also email our support team directly.
             </p>
             <a href="mailto:support@qrmenu.com" className="text-orange-600 dark:text-orange-400 font-medium hover:underline text-sm break-all">
                support@qrmenu.com
             </a>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Why Feedback Matters</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg h-fit">
                   <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                   <h4 className="font-medium text-sm text-gray-900 dark:text-white">We Listen</h4>
                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Every message is read by a human within 24h.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg h-fit">
                   <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                   <h4 className="font-medium text-sm text-gray-900 dark:text-white">We Improve</h4>
                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Your feature requests shape our roadmap.</p>
                </div>
              </li>
              <li className="flex gap-3">
                 <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg h-fit">
                   <Bug className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                   <h4 className="font-medium text-sm text-gray-900 dark:text-white">We Fix</h4>
                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Bugs are prioritized and squashed quickly.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
