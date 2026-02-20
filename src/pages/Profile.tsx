import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  Loader2, 
  User, 
  FileText, 
  Bookmark, 
  Award, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  GraduationCap,
  Network,
  Save
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuthContext } from '@/contexts/AuthContext';
import { NotionEditor, Block, markdownToBlocks, blocksToMarkdown } from '@/components/profile/NotionEditor';
import { KnowledgeGraph } from '@/components/profile/KnowledgeGraph';
import { ExpertApplicationForm } from '@/components/profile/ExpertApplicationForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ResearchNote {
  id: string;
  title: string;
  content: string;
  blocks?: Block[];
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

interface SavedCase {
  id: string;
  case_id: string;
  case_title: string;
  notes: string | null;
  created_at: string;
}

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, profile, role, isLoading, isAuthenticated, updateProfile } = useAuthContext();
  const { toast } = useToast();

  const [viewingProfile, setViewingProfile] = useState(profile);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [notes, setNotes] = useState<ResearchNote[]>([]);
  const [savedCases, setSavedCases] = useState<SavedCase[]>([]);
  const [selectedNote, setSelectedNote] = useState<ResearchNote | null>(null);
  const [noteBlocks, setNoteBlocks] = useState<Block[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Profile edit state
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');

  // New note dialog
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [isNewNoteOpen, setIsNewNoteOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/auth');
      return;
    }

    const targetUserId = userId || user?.id;
    setIsOwnProfile(!userId || userId === user?.id);

    if (targetUserId) {
      loadUserData(targetUserId);
    }
  }, [userId, user, isLoading, isAuthenticated]);

  useEffect(() => {
    if (profile && isOwnProfile) {
      setViewingProfile(profile);
      setEditDisplayName(profile.display_name);
      setEditBio(profile.bio || '');
      setEditSpecialty(profile.specialty || '');
    }
  }, [profile, isOwnProfile]);

  // Convert note content to blocks when selecting a note
  useEffect(() => {
    if (selectedNote) {
      if (selectedNote.blocks) {
        setNoteBlocks(selectedNote.blocks);
      } else {
        // Convert markdown content to blocks
        setNoteBlocks(markdownToBlocks(selectedNote.content));
      }
    } else {
      setNoteBlocks([]);
    }
  }, [selectedNote]);

  const loadUserData = async (targetUserId: string) => {
    // Load profile if viewing another user
    if (userId && userId !== user?.id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (profileData) {
        setViewingProfile(profileData);
      }
    }

    // Load notes (own or public)
    let notesQuery = supabase.from('research_notes').select('*');
    if (isOwnProfile) {
      notesQuery = notesQuery.eq('user_id', targetUserId);
    } else {
      notesQuery = notesQuery.eq('user_id', targetUserId).eq('is_public', true);
    }
    const { data: notesData } = await notesQuery.order('updated_at', { ascending: false });
    setNotes(notesData || []);

    // Load saved cases (own only)
    if (isOwnProfile) {
      const { data: casesData } = await supabase
        .from('saved_cases')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });
      setSavedCases(casesData || []);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    await updateProfile({
      display_name: editDisplayName,
      bio: editBio || null,
      specialty: editSpecialty || null,
    });
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim() || !user) return;

    const initialBlock: Block = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'paragraph',
      content: '',
    };

    const { data, error } = await supabase
      .from('research_notes')
      .insert({
        user_id: user.id,
        title: newNoteTitle.trim(),
        content: '',
        blocks: [initialBlock],
        is_public: false,
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error creating note', description: error.message, variant: 'destructive' });
      return;
    }

    setNotes([data, ...notes]);
    setSelectedNote(data);
    setNoteBlocks([initialBlock]);
    setNewNoteTitle('');
    setIsNewNoteOpen(false);
    toast({ title: 'Note created' });
  };

  const handleSaveNote = useCallback(async () => {
    if (!selectedNote) return;

    setIsSaving(true);
    const markdown = blocksToMarkdown(noteBlocks);
    
    const { error } = await supabase
      .from('research_notes')
      .update({ 
        content: markdown, 
        blocks: noteBlocks,
        updated_at: new Date().toISOString() 
      })
      .eq('id', selectedNote.id);

    if (error) {
      toast({ title: 'Error saving', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Note saved' });
      setNotes(notes.map(n => n.id === selectedNote.id ? { ...n, content: markdown, blocks: noteBlocks } : n));
    }
    setIsSaving(false);
  }, [selectedNote, noteBlocks, notes]);

  const handleToggleNoteVisibility = async (note: ResearchNote) => {
    const { error } = await supabase
      .from('research_notes')
      .update({ is_public: !note.is_public })
      .eq('id', note.id);

    if (!error) {
      setNotes(notes.map(n => n.id === note.id ? { ...n, is_public: !n.is_public } : n));
      if (selectedNote?.id === note.id) {
        setSelectedNote({ ...selectedNote, is_public: !note.is_public });
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const { error } = await supabase.from('research_notes').delete().eq('id', noteId);
    if (!error) {
      setNotes(notes.filter(n => n.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
        setNoteBlocks([]);
      }
      toast({ title: 'Note deleted' });
    }
  };

  const handleRemoveSavedCase = async (caseId: string) => {
    const { error } = await supabase.from('saved_cases').delete().eq('id', caseId);
    if (!error) {
      setSavedCases(savedCases.filter(c => c.id !== caseId));
    }
  };

  const handleBlocksChange = useCallback((newBlocks: Block[]) => {
    setNoteBlocks(newBlocks);
    // Auto-save after a delay
    if (selectedNote && isOwnProfile) {
      const timeoutId = setTimeout(() => {
        handleSaveNote();
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedNote, isOwnProfile, handleSaveNote]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayProfile = viewingProfile || profile;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {displayProfile?.display_name?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Display Name</Label>
                      <Input
                        value={editDisplayName}
                        onChange={e => setEditDisplayName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Specialty</Label>
                      <Input
                        value={editSpecialty}
                        onChange={e => setEditSpecialty(e.target.value)}
                        placeholder="e.g., Cardiology, Internal Medicine"
                      />
                    </div>
                    <div>
                      <Label>Bio</Label>
                      <Textarea
                        value={editBio}
                        onChange={e => setEditBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSaveProfile} disabled={isSaving}>
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <h1 className="text-2xl font-bold">{displayProfile?.display_name}</h1>
                      <Badge variant={role === 'admin' ? 'default' : role === 'expert' ? 'secondary' : 'outline'}>
                        {role === 'admin' ? <Award className="h-3 w-3 mr-1" /> : null}
                        {role === 'expert' ? <GraduationCap className="h-3 w-3 mr-1" /> : null}
                        {role?.charAt(0).toUpperCase() + role?.slice(1)}
                      </Badge>
                    </div>
                    {displayProfile?.specialty && (
                      <p className="text-muted-foreground">{displayProfile.specialty}</p>
                    )}
                    {displayProfile?.bio && (
                      <p className="mt-2 text-sm">{displayProfile.bio}</p>
                    )}
                    {isOwnProfile && (
                      <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsEditing(true)}>
                        Edit Profile
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="notes" className="space-y-6">
          <TabsList>
            <TabsTrigger value="notes" className="gap-2">
              <FileText className="h-4 w-4" />
              Research Notes
            </TabsTrigger>
            <TabsTrigger value="graph" className="gap-2">
              <Network className="h-4 w-4" />
              Knowledge Graph
            </TabsTrigger>
            {isOwnProfile && (
              <TabsTrigger value="saved" className="gap-2">
                <Bookmark className="h-4 w-4" />
                Saved Cases
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="notes">
            <div className="grid lg:grid-cols-4 gap-6">
              {/* Notes List */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Notes ({notes.length})</CardTitle>
                    {isOwnProfile && (
                      <Dialog open={isNewNoteOpen} onOpenChange={setIsNewNoteOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>New Research Note</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label>Title</Label>
                              <Input
                                value={newNoteTitle}
                                onChange={e => setNewNoteTitle(e.target.value)}
                                placeholder="My research notes..."
                              />
                            </div>
                            <Button onClick={handleCreateNote} disabled={!newNoteTitle.trim()}>
                              Create Note
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {notes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No notes yet. Create your first note!
                    </p>
                  ) : (
                    notes.map(note => (
                      <div
                        key={note.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedNote?.id === note.id ? 'bg-accent border-primary' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedNote(note)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate">{note.title}</span>
                          {note.is_public ? (
                            <Eye className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <EyeOff className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(note.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Notion Editor */}
              <Card className="lg:col-span-3">
                <CardHeader className="pb-3">
                  {selectedNote ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">{selectedNote.title}</CardTitle>
                        <CardDescription>
                          Press Enter to create new block • Cmd/Ctrl+S to save
                        </CardDescription>
                      </div>
                      {isOwnProfile && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleSaveNote}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleNoteVisibility(selectedNote)}
                          >
                            {selectedNote.is_public ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => handleDeleteNote(selectedNote.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <CardTitle className="text-base text-muted-foreground">
                      Select a note to start editing
                    </CardTitle>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedNote ? (
                    <NotionEditor
                      blocks={noteBlocks}
                      onChange={handleBlocksChange}
                      onSave={handleSaveNote}
                      readOnly={!isOwnProfile}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                      <FileText className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-lg font-medium">No note selected</p>
                      <p className="text-sm">Choose a note from the list or create a new one</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="graph">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Knowledge Graph
                </CardTitle>
                <CardDescription>
                  Visualize connections between your notes, concepts, and cases.
                  Drag to pan, scroll to zoom.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <KnowledgeGraph
                  notes={notes.map(n => ({ id: n.id, title: n.title, content: n.content }))}
                  cases={savedCases.map(c => ({ id: c.case_id, title: c.case_title, specialty: '' }))}
                  onNodeClick={(nodeId) => {
                    const note = notes.find(n => n.id === nodeId);
                    if (note) {
                      setSelectedNote(note);
                      // Switch to notes tab
                      const notesTab = document.querySelector('[value="notes"]') as HTMLElement;
                      notesTab?.click();
                    }
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedCases.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No saved cases yet</p>
                    <Link to="/cases">
                      <Button variant="link">Browse cases</Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                savedCases.map(saved => (
                  <Card key={saved.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">{saved.case_title}</CardTitle>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleRemoveSavedCase(saved.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardDescription>
                        Saved {new Date(saved.created_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {saved.notes && (
                        <p className="text-sm text-muted-foreground mb-3">{saved.notes}</p>
                      )}
                      <Link to={`/studio/${saved.case_id}`}>
                        <Button size="sm" variant="outline" className="w-full">
                          Open Case
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Expert Application Section - shown for learners */}
        {isOwnProfile && role === 'learner' && user && (
          <div className="mt-8">
            <ExpertApplicationForm userId={user.id} />
          </div>
        )}
      </main>
    </div>
  );
}
