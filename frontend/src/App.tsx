import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VideoDetail from './pages/VideoDetail';
import ArtistProfile from './pages/ArtistProfile';
import Artists from './pages/Artists';
import Trending from './pages/Trending';
import Search from './pages/Search';
import Playlists from './pages/Playlists';
import PlaylistDetail from './pages/PlaylistDetail';
import Following from './pages/Following';
import ArtistDashboard from './pages/ArtistDashboard';
import UploadVideo from './pages/UploadVideo';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/*"
        element={
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/trending" element={<Trending />} />
              <Route path="/artists" element={<Artists />} />
              <Route path="/artists/:id" element={<ArtistProfile />} />
              <Route path="/videos/:id" element={<VideoDetail />} />
              <Route path="/search" element={<Search />} />
              <Route
                path="/playlists"
                element={<ProtectedRoute><Playlists /></ProtectedRoute>}
              />
              <Route
                path="/playlists/:id"
                element={<ProtectedRoute><PlaylistDetail /></ProtectedRoute>}
              />
              <Route
                path="/following"
                element={<ProtectedRoute><Following /></ProtectedRoute>}
              />
              <Route
                path="/dashboard"
                element={<ProtectedRoute role="ARTIST"><ArtistDashboard /></ProtectedRoute>}
              />
              <Route
                path="/upload"
                element={<ProtectedRoute role="ARTIST"><UploadVideo /></ProtectedRoute>}
              />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}
