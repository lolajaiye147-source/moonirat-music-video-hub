import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateVideo } from '../hooks/useVideos';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';

export default function UploadVideo() {
  const navigate = useNavigate();
  const createVideo = useCreateVideo();
  const [form, setForm] = useState({ title: '', description: '', videoUrl: '', thumbnailUrl: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.videoUrl) { toast.error('Title and video URL are required'); return; }
    setLoading(true);
    try {
      const video = await createVideo.mutateAsync(form);
      toast.success('Video uploaded!');
      navigate(`/videos/${video.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="flex items-center gap-2 text-2xl font-bold text-white mb-6">
        <Upload size={22} className="text-moon-400" /> Upload Video
      </h1>
      <form onSubmit={handleSubmit} className="bg-dark-800 border border-dark-600 rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Title *</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
            className="w-full px-4 py-2.5 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-moon-500"
            placeholder="Video title" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Video URL *</label>
          <input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} required
            className="w-full px-4 py-2.5 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-moon-500"
            placeholder="https://s3.example.com/your-video.mp4 or YouTube/Vimeo URL" />
          <p className="mt-1 text-xs text-gray-500">Paste an S3 presigned URL, YouTube, or Vimeo link</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Thumbnail URL</label>
          <input value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })}
            className="w-full px-4 py-2.5 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-moon-500"
            placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4}
            className="w-full px-4 py-2.5 bg-dark-700 border border-dark-500 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-moon-500 resize-none"
            placeholder="Tell fans about this video..." />
        </div>
        <button type="submit" disabled={loading} className="w-full py-2.5 bg-moon-600 hover:bg-moon-500 disabled:opacity-60 text-white font-semibold rounded-lg transition-colors">
          {loading ? 'Publishing...' : 'Publish Video'}
        </button>
      </form>
    </div>
  );
}
