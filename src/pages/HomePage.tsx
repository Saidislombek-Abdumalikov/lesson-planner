import React, { useState, useEffect } from 'react';
import { Plus, Users, Sparkles, BookOpen, Search, RefreshCw } from 'lucide-react';
import { Group } from '../types';
import { getAllGroups, createGroup, updateGroup, deleteGroup } from '../db/db';
import { seedSampleData } from '../db/seed';
import { GroupCard } from '../components/groups/GroupCard';
import { GroupModal } from '../components/groups/GroupModal';
import { ConfirmModal } from '../components/layout/ConfirmModal';

interface HomePageProps {
  onOpenGroup: (groupId: string) => void;
  onNewLesson: (groupId: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenGroup, onNewLesson }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [isSeeding, setIsSeeding] = useState(false);

  const loadGroups = async () => {
    try {
      const data = await getAllGroups();
      setGroups(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleSaveGroup = async (name: string, description?: string) => {
    if (editingGroup) {
      await updateGroup(editingGroup.id, name, description);
    } else {
      await createGroup(name, description);
    }
    await loadGroups();
  };

  const handleConfirmDelete = async () => {
    if (groupToDelete) {
      await deleteGroup(groupToDelete.id);
      setGroupToDelete(null);
      await loadGroups();
    }
  };

  const handleSeedData = async () => {
    try {
      setIsSeeding(true);
      await seedSampleData();
      await loadGroups();
    } finally {
      setIsSeeding(false);
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Groups
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Select a class group to view or record lessons and teaching materials.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {groups.length > 0 && (
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter groups..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          )}

          <button
            onClick={() => {
              setEditingGroup(null);
              setIsGroupModalOpen(true);
            }}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Group</span>
          </button>
        </div>
      </div>

      {/* Groups Grid / Empty State */}
      {loading ? (
        <div className="py-20 text-center text-sm text-slate-400">
          Loading groups...
        </div>
      ) : groups.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto shadow-xs">
            <Users className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              No Groups Yet
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Create your first student class group (e.g. "Group 10–12" or "IELTS") to start planning and archiving lessons.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <button
              onClick={() => {
                setEditingGroup(null);
                setIsGroupModalOpen(true);
              }}
              className="w-full sm:w-auto px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Your First Group</span>
            </button>

            <button
              onClick={handleSeedData}
              disabled={isSeeding}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>{isSeeding ? 'Loading sample data...' : 'Load Sample Lessons'}</span>
            </button>
          </div>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          No groups match "{searchQuery}"
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredGroups.map(group => (
            <GroupCard
              key={group.id}
              group={group}
              onOpenGroup={onOpenGroup}
              onNewLesson={onNewLesson}
              onEditGroup={g => {
                setEditingGroup(g);
                setIsGroupModalOpen(true);
              }}
              onDeleteGroup={g => setGroupToDelete(g)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Group Modal */}
      <GroupModal
        isOpen={isGroupModalOpen}
        groupToEdit={editingGroup}
        onSave={handleSaveGroup}
        onClose={() => {
          setIsGroupModalOpen(false);
          setEditingGroup(null);
        }}
      />

      {/* Delete Group Confirmation Modal */}
      <ConfirmModal
        isOpen={!!groupToDelete}
        title="Delete Group?"
        message={`Are you sure you want to delete "${groupToDelete?.name}"? This will permanently remove all lessons, attached files, and print lists inside this group.`}
        confirmLabel="Delete Group"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setGroupToDelete(null)}
      />
    </div>
  );
};
