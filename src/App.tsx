import { AnimatePresence, motion } from 'framer-motion';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { BottomNav } from './components/BottomNav';
import { Layout } from './components/Layout';
import { HomePage } from './features/journal/pages/HomePage';
import { MoodCalendarPage } from './features/journal/pages/MoodCalendarPage';
import { NewEntryPage } from './features/journal/pages/NewEntryPage';
import { EntryDetailPage } from './features/journal/pages/EntryDetailPage';
import { MaskOffPage } from './features/maskoff/pages/MaskOffPage';
import { MaskOffDetailPage } from './features/maskoff/pages/MaskOffDetailPage';
import { NewMaskOffPage } from './features/maskoff/pages/NewMaskOffPage';

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
      <BottomNav />
    </BrowserRouter>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10, filter: 'blur(5px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        className="min-h-screen"
      >
        <Routes location={location}>
          <Route path="/" element={
            <Layout>
              <HomePage />
            </Layout>
          } />
          <Route path="/new" element={
            <Layout>
              <NewEntryPage />
            </Layout>
          } />
          <Route path="/mood-calendar" element={
            <Layout>
              <MoodCalendarPage />
            </Layout>
          } />
          <Route path="/entry/:id" element={
            <Layout>
              <EntryDetailPage />
            </Layout>
          } />
          <Route path="/maskoff" element={
            <Layout>
              <MaskOffPage />
            </Layout>
          } />
          <Route path="/maskoff-detail/:id" element={
            <Layout>
              <MaskOffDetailPage />
            </Layout>
          } />
          <Route path="/new-maskoff" element={
            <Layout>
              <NewMaskOffPage />
            </Layout>
          } />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default App;
