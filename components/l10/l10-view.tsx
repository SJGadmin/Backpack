'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Folder, FileText, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  getL10Folders,
  getL10DocumentsForFolder,
  getL10Document,
} from '@/lib/actions/l10';
import type {
  L10FolderWithCount,
  L10DocumentSummary,
  L10Document,
  UserInfo,
} from '@/lib/types';
import { L10FolderDialog } from './l10-folder-dialog';
import { L10DocumentDialog } from './l10-document-dialog';
import { L10DocumentEditor } from './l10-document-editor';

interface L10ViewProps {
  users: UserInfo[];
}

export function L10View({ users }: L10ViewProps) {
  const [folders, setFolders] = useState<L10FolderWithCount[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<L10DocumentSummary[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [document, setDocument] = useState<L10Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<L10FolderWithCount | null>(null);

  // Load folders on mount
  useEffect(() => {
    loadFolders();
  }, []);

  // Load documents when folder is selected
  useEffect(() => {
    if (selectedFolderId) {
      loadDocuments(selectedFolderId);
    } else {
      setDocuments([]);
      setSelectedDocumentId(null);
      setDocument(null);
    }
  }, [selectedFolderId]);

  // Load document when selected
  useEffect(() => {
    if (selectedDocumentId) {
      loadDocument(selectedDocumentId);
    } else {
      setDocument(null);
    }
  }, [selectedDocumentId]);

  const loadFolders = async () => {
    try {
      const data = await getL10Folders();
      setFolders(data);
    } catch (error) {
      console.error('Failed to load folders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocuments = async (folderId: string) => {
    try {
      const data = await getL10DocumentsForFolder(folderId);
      setDocuments(data);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  };

  const loadDocument = async (documentId: string) => {
    try {
      const data = await getL10Document(documentId);
      setDocument(data);
    } catch (error) {
      console.error('Failed to load document:', error);
    }
  };

  const handleFolderCreated = () => {
    loadFolders();
    setIsFolderDialogOpen(false);
    setEditingFolder(null);
  };

  const handleDocumentCreated = () => {
    if (selectedFolderId) {
      loadDocuments(selectedFolderId);
    }
    loadFolders(); // Update document counts
    setIsDocumentDialogOpen(false);
  };

  const handleDocumentUpdated = () => {
    if (selectedDocumentId) {
      loadDocument(selectedDocumentId);
    }
    if (selectedFolderId) {
      loadDocuments(selectedFolderId);
    }
  };

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Folders Sidebar */}
      <div className="w-56 border-r flex flex-col bg-card/50">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Folders
            </h3>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setEditingFolder(null);
                setIsFolderDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {folders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No folders yet
              </p>
            ) : (
              folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedFolderId === folder.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  <Folder className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 text-left truncate">{folder.name}</span>
                  <span
                    className={`text-xs ${
                      selectedFolderId === folder.id
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {folder._count.documents}
                  </span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Documents List */}
      <div className="w-64 border-r flex flex-col bg-card/30">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {selectedFolder ? selectedFolder.name : 'Meetings'}
            </h3>
            {selectedFolderId && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsDocumentDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {!selectedFolderId ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Select a folder
              </p>
            ) : documents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No meetings yet
              </p>
            ) : (
              documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setSelectedDocumentId(doc.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedDocumentId === doc.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 text-left min-w-0">
                    <p className="truncate font-medium">
                      {doc.weekNumber ? `Week ${doc.weekNumber}` : format(new Date(doc.meetingDate), 'MMM d')}
                    </p>
                    <p
                      className={`text-xs truncate ${
                        selectedDocumentId === doc.id
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {format(new Date(doc.meetingDate), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 opacity-50" />
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Document Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {document ? (
          <L10DocumentEditor
            document={document}
            users={users}
            onUpdate={handleDocumentUpdated}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {selectedFolderId
                  ? 'Select a meeting to view'
                  : 'Select a folder to get started'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <L10FolderDialog
        open={isFolderDialogOpen}
        onOpenChange={setIsFolderDialogOpen}
        folder={editingFolder}
        onSuccess={handleFolderCreated}
      />

      {selectedFolderId && (
        <L10DocumentDialog
          open={isDocumentDialogOpen}
          onOpenChange={setIsDocumentDialogOpen}
          folderId={selectedFolderId}
          onSuccess={handleDocumentCreated}
        />
      )}
    </div>
  );
}
