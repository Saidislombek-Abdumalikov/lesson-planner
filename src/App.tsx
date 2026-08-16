import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/layout/Header';
import { HomePage } from './pages/HomePage';
import { GroupPage } from './pages/GroupPage';
import { LessonPage } from './pages/LessonPage';
import { SettingsPage } from './pages/SettingsPage';
import { SearchModal } from './components/search/SearchModal';
import { Group, Lesson } from './types';
import { getGroup, getLesson, createLesson } from './db/db';

type ViewState = 
  | { type: 'home' }
  | { type: 'group'; groupId: string }
  | { type: 'lesson'; lessonId: string }
  | { type: 'settings' };

export const App: React.FC = () => {
  const [viewState, setViewState] = useState<ViewState>({ type: 'home' });
  const [currentGroup, setCurrentGroup] = useState<Group | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Sync hash routing
  useEffect(() => {
    const parseHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/group/')) {
        const gId = hash.replace('#/group/', '');
        setViewState({ type: 'group', groupId: gId });
      } else if (hash.startsWith('#/lesson/')) {
        const lId = hash.replace('#/lesson/', '');
        setViewState({ type: 'lesson', lessonId: lId });
      } else if (hash === '#/settings') {
        setViewState({ type: 'settings' });
      } else {
        setViewState({ type: 'home' });
      }
    };

    parseHash();
    window.addEventListener('hashchange', parseHash);
    return () => window.removeEventListener('hashchange', parseHash);
  }, []);

  // Sync state data for breadcrumbs
  useEffect(() => {
    if (viewState.type === 'group') {
      getGroup(viewState.groupId).then(g => {
        setCurrentGroup(g || null);
        setCurrentLesson(null);
      });
    } else if (viewState.type === 'lesson') {
      getLesson(viewState.lessonId).then(l => {
        if (l) {
          setCurrentLesson(l);
          getGroup(l.groupId).then(g => setCurrentGroup(g || null));
        }
      });
    } else {
      setCurrentGroup(null);
      setCurrentLesson(null);
    }
  }, [viewState]);

  // Global Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigateToHome = () => {
    window.location.hash = '#/';
  };

  const navigateToGroup = (groupId: string) => {
    window.location.hash = `#/group/${groupId}`;
  };

  const navigateToLesson = (lessonId: string) => {
    window.location.hash = `#/lesson/${lessonId}`;
  };

  const navigateToSettings = () => {
    window.location.hash = '#/settings';
  };

  const handleCreateNewLesson = async (groupId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const newLesson = await createLesson({
      groupId,
      date: today,
      title: 'New Lesson',
      lessonPlan: '',
      homework: '',
      notes: '',
    });
    navigateToLesson(newLesson.id);
  };

  // Build Breadcrumbs
  const getBreadcrumbs = () => {
    const crumbs: { label: string; onClick?: () => void }[] = [];

    if (viewState.type === 'group' && currentGroup) {
      crumbs.push({ label: 'Groups', onClick: navigateToHome });
      crumbs.push({ label: currentGroup.name });
    } else if (viewState.type === 'lesson' && currentLesson) {
      crumbs.push({ label: 'Groups', onClick: navigateToHome });
      if (currentGroup) {
        crumbs.push({ 
          label: currentGroup.name, 
          onClick: () => navigateToGroup(currentGroup.id) 
        });
      }
      crumbs.push({ label: currentLesson.title || currentLesson.date });
    } else if (viewState.type === 'settings') {
      crumbs.push({ label: 'Groups', onClick: navigateToHome });
      crumbs.push({ label: 'Settings' });
    }

    return crumbs;
  };

  const getBackButtonAction = () => {
    if (viewState.type === 'group') return navigateToHome;
    if (viewState.type === 'lesson') {
      return currentGroup ? () => navigateToGroup(currentGroup.id) : navigateToHome;
    }
    if (viewState.type === 'settings') return navigateToHome;
    return undefined;
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        {/* Sticky Global Header */}
        <Header
          breadcrumbs={getBreadcrumbs()}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenSettings={navigateToSettings}
          onBack={getBackButtonAction()}
        />

        {/* Main Content Area */}
        <main className="flex-1 pb-16">
          {viewState.type === 'home' && (
            <HomePage
              onOpenGroup={navigateToGroup}
              onNewLesson={handleCreateNewLesson}
            />
          )}

          {viewState.type === 'group' && (
            <GroupPage
              groupId={viewState.groupId}
              onBack={navigateToHome}
              onOpenLesson={navigateToLesson}
              onNewLesson={handleCreateNewLesson}
            />
          )}

          {viewState.type === 'lesson' && (
            <LessonPage
              lessonId={viewState.lessonId}
              onBack={() => currentGroup ? navigateToGroup(currentGroup.id) : navigateToHome()}
              onOpenLesson={navigateToLesson}
            />
          )}

          {viewState.type === 'settings' && (
            <SettingsPage
              onBack={navigateToHome}
              onRefreshData={() => {
                // Refresh top-level breadcrumb state if needed
                setCurrentGroup(null);
                setCurrentLesson(null);
              }}
            />
          )}
        </main>

        {/* Global Search Modal */}
        <SearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onSelectLesson={navigateToLesson}
        />
      </div>
    </ThemeProvider>
  );
};

export default App;
