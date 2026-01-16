'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Board, Column as ColumnType, Card as CardType } from '@/lib/types';
import { KanbanColumn } from '@/components/kanban-column';
import { KanbanCard } from '@/components/kanban-card';
import { CardDrawer } from '@/components/card-drawer';
import { CalendarView } from '@/components/calendar-view';
import { L10View } from '@/components/l10/l10-view';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getBoard, createColumn, updateColumn, deleteColumn } from '@/lib/actions/board';
import { createCard, moveCard, searchCards } from '@/lib/actions/cards';
import { logout, getCurrentUser, getAllUsers } from '@/lib/actions/auth';
import { Plus, Search, LogOut, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function BoardPage() {
  const router = useRouter();
  const [board, setBoard] = useState<Board | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [activeCard, setActiveCard] = useState<CardType | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<ColumnType | null>(null);
  const [columnName, setColumnName] = useState('');
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [newCardColumnId, setNewCardColumnId] = useState('');
  const [newCardTitle, setNewCardTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CardType[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadBoard();
    loadCurrentUser();
    loadAllUsers();
  }, []);

  const loadBoard = async () => {
    try {
      const data = await getBoard();
      if (data) {
        setBoard(data);

        // Update selected card if drawer is open
        if (selectedCard) {
          const updatedCard = data.columns
            .flatMap((col: ColumnType) => col.cards)
            .find((c: CardType) => c.id === selectedCard.id);
          if (updatedCard) {
            setSelectedCard(updatedCard);
          }
        }
      }
    } catch (error) {
      toast.error('Failed to load board');
    }
  };

  const loadAllUsers = async () => {
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to load users');
    }
  };

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load current user');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = board?.columns
      .flatMap((col: ColumnType) => col.cards)
      .find((c: CardType) => c.id === active.id);
    setActiveCard(card || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handle visual feedback during drag
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !board) return;

    const activeCard = board.columns
      .flatMap((col: ColumnType) => col.cards)
      .find((c: CardType) => c.id === active.id);

    if (!activeCard) return;

    // Find source column
    const sourceColumn = board.columns.find((col: ColumnType) =>
      col.cards.some((c: CardType) => c.id === active.id)
    );

    // Find destination column
    let destinationColumn = board.columns.find((col: ColumnType) => col.id === over.id);
    if (!destinationColumn) {
      const overCard = board.columns
        .flatMap((col: ColumnType) => col.cards)
        .find((c: CardType) => c.id === over.id);
      destinationColumn = board.columns.find((col: ColumnType) =>
        col.cards.some((c: CardType) => c.id === over.id)
      );
    }

    if (!destinationColumn || !sourceColumn) return;

    const destinationCards = destinationColumn.cards;
    const overCard = destinationCards.find((c: CardType) => c.id === over.id);
    const newIndex = overCard
      ? destinationCards.indexOf(overCard)
      : destinationCards.length;

    // Optimistic update - update local state immediately
    const updatedColumns = board.columns.map((col: ColumnType) => {
      if (col.id === sourceColumn.id) {
        // Remove card from source column
        return {
          ...col,
          cards: col.cards.filter((c: CardType) => c.id !== activeCard.id)
        };
      } else if (col.id === destinationColumn.id) {
        // Add card to destination column at the new index
        const newCards = [...col.cards];
        newCards.splice(newIndex, 0, activeCard);
        return {
          ...col,
          cards: newCards
        };
      }
      return col;
    });

    setBoard({ ...board, columns: updatedColumns });
    setActiveCard(null);

    // Save to database in background
    try {
      await moveCard(activeCard.id, destinationColumn.id, newIndex);
      toast.success('Card moved');
    } catch (error) {
      toast.error('Failed to move card');
      // Revert on error
      loadBoard();
    }
  };

  const handleAddColumn = () => {
    setEditingColumn(null);
    setColumnName('');
    setIsColumnDialogOpen(true);
  };

  const handleEditColumn = (column: ColumnType) => {
    setEditingColumn(column);
    setColumnName(column.name);
    setIsColumnDialogOpen(true);
  };

  const handleSaveColumn = async () => {
    if (!board) return;

    try {
      if (editingColumn) {
        await updateColumn(editingColumn.id, columnName);
        toast.success('Column updated');
      } else {
        await createColumn(board.id, columnName);
        toast.success('Column created');
      }
      await loadBoard();
      setIsColumnDialogOpen(false);
    } catch (error) {
      toast.error('Failed to save column');
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (!confirm('Delete this column and all its cards?')) return;

    try {
      await deleteColumn(columnId);
      await loadBoard();
      toast.success('Column deleted');
    } catch (error) {
      toast.error('Failed to delete column');
    }
  };

  const handleAddCard = (columnId: string) => {
    setNewCardColumnId(columnId);
    setNewCardTitle('');
    setIsCardDialogOpen(true);
  };

  const handleCreateCard = async () => {
    if (!newCardTitle.trim()) return;

    try {
      await createCard(newCardColumnId, newCardTitle);
      await loadBoard();
      setIsCardDialogOpen(false);
      toast.success('Card created');
    } catch (error) {
      toast.error('Failed to create card');
    }
  };

  const handleCardClick = (card: CardType) => {
    setSelectedCard(card);
    setIsDrawerOpen(true);
    router.push(`/board?card=${card.id}`, { scroll: false });
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedCard(null);
    router.push('/board', { scroll: false });
    loadBoard();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await searchCards(searchQuery);
      setSearchResults(results as unknown as CardType[]);
    } catch (error) {
      toast.error('Search failed');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  if (!board) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b bg-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/Backpack No Background.png" alt="Backpack Logo" className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Backpack</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              className="w-64"
            />
            <Button onClick={handleSearch} size="sm" variant="default">
              Search
            </Button>
          </div>
          {currentUser && (
            <div className="text-sm text-muted-foreground">
              {currentUser.name}
            </div>
          )}
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <Tabs defaultValue="kanban" className="flex-1 flex flex-col">
        <div className="border-b px-6 bg-card">
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="l10">
              <FileText className="h-4 w-4 mr-1" />
              L10
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="kanban" className="flex-1 overflow-hidden m-0">
          {searchResults.length > 0 && (
            <div className="p-6 bg-card border-b">
              <h2 className="text-lg font-semibold mb-4">
                Search Results ({searchResults.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((card: CardType) => (
                  <div key={card.id} onClick={() => handleCardClick(card)}>
                    <KanbanCard card={card} onClick={() => handleCardClick(card)} />
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchResults([]);
                  setSearchQuery('');
                }}
                className="mt-4"
              >
                Clear search
              </Button>
            </div>
          )}

          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex-1 overflow-x-auto p-6">
              <div className="flex gap-4 h-full">
                {board.columns.map((column: ColumnType) => (
                  <KanbanColumn
                    key={column.id}
                    column={column}
                    onCardClick={handleCardClick}
                    onAddCard={handleAddCard}
                    onEditColumn={handleEditColumn}
                    onDeleteColumn={handleDeleteColumn}
                  />
                ))}
                <div className="flex-shrink-0">
                  <Button
                    variant="outline"
                    onClick={handleAddColumn}
                    className="h-12"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Column
                  </Button>
                </div>
              </div>
            </div>

            <DragOverlay>
              {activeCard ? (
                <KanbanCard card={activeCard} onClick={() => {}} />
              ) : null}
            </DragOverlay>
          </DndContext>
        </TabsContent>

        <TabsContent value="calendar" className="flex-1 overflow-auto m-0 p-6">
          <div className="bg-card rounded-lg p-6">
            <CalendarView
              cards={board?.columns.flatMap((col: ColumnType) => col.cards) || []}
              onEventClick={async (cardId: string) => {
                const card = board?.columns
                  .flatMap((col: ColumnType) => col.cards)
                  .find((c: CardType) => c.id === cardId);
                if (card) {
                  handleCardClick(card);
                }
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="l10" className="flex-1 overflow-hidden m-0">
          <L10View users={users} />
        </TabsContent>
      </Tabs>

      <CardDrawer
        card={selectedCard}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        users={users}
        onUpdate={loadBoard}
      />

      <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingColumn ? 'Edit Column' : 'New Column'}
            </DialogTitle>
            <DialogDescription>
              {editingColumn
                ? 'Update the column name'
                : 'Create a new column for your board'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="column-name">Column Name</Label>
              <Input
                id="column-name"
                value={columnName}
                onChange={(e) => setColumnName(e.target.value)}
                placeholder="e.g., In Progress"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsColumnDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveColumn}>
              {editingColumn ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Card</DialogTitle>
            <DialogDescription>Create a new project card</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="card-title">Card Title</Label>
              <Input
                id="card-title"
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                placeholder="e.g., Website Redesign"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateCard();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCardDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCard}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
