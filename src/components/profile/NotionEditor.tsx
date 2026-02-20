import React, { useState, useRef, useCallback } from 'react';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Heading1, 
  Heading2, 
  Heading3, 
  Type, 
  List, 
  CheckSquare, 
  Quote,
  Image as ImageIcon,
  Code,
  MoreHorizontal,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export type BlockType = 
  | 'paragraph' 
  | 'heading1' 
  | 'heading2' 
  | 'heading3' 
  | 'bulletList' 
  | 'numberedList' 
  | 'checkList' 
  | 'quote' 
  | 'code' 
  | 'image';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  metadata?: Record<string, unknown>;
}

interface NotionEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  onSave?: () => void;
  readOnly?: boolean;
}

const blockIcons: Record<BlockType, React.ReactNode> = {
  paragraph: <Type className="h-4 w-4" />,
  heading1: <Heading1 className="h-4 w-4" />,
  heading2: <Heading2 className="h-4 w-4" />,
  heading3: <Heading3 className="h-4 w-4" />,
  bulletList: <List className="h-4 w-4" />,
  numberedList: <List className="h-4 w-4" />,
  checkList: <CheckSquare className="h-4 w-4" />,
  quote: <Quote className="h-4 w-4" />,
  code: <Code className="h-4 w-4" />,
  image: <ImageIcon className="h-4 w-4" />,
};

const blockLabels: Record<BlockType, string> = {
  paragraph: 'Text',
  heading1: 'Heading 1',
  heading2: 'Heading 2',
  heading3: 'Heading 3',
  bulletList: 'Bullet List',
  numberedList: 'Numbered List',
  checkList: 'To-do List',
  quote: 'Quote',
  code: 'Code',
  image: 'Image',
};

export function NotionEditor({ blocks, onChange, onSave, readOnly = false }: NotionEditorProps) {
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState<string | null>(null);
  const blockRefs = useRef<Map<string, HTMLTextAreaElement>>(new Map());

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  }, [blocks, onChange]);

  const addBlock = useCallback((afterId: string, type: BlockType = 'paragraph') => {
    const newBlock: Block = {
      id: generateId(),
      type,
      content: '',
    };
    const index = blocks.findIndex(b => b.id === afterId);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    onChange(newBlocks);
    
    // Focus the new block after render
    setTimeout(() => {
      blockRefs.current.get(newBlock.id)?.focus();
    }, 0);
  }, [blocks, onChange]);

  const deleteBlock = useCallback((id: string) => {
    if (blocks.length <= 1) return;
    const index = blocks.findIndex(b => b.id === id);
    onChange(blocks.filter(b => b.id !== id));
    
    // Focus previous block
    if (index > 0) {
      setTimeout(() => {
        const prevBlock = blocks[index - 1];
        blockRefs.current.get(prevBlock.id)?.focus();
      }, 0);
    }
  }, [blocks, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBlock(blockId);
    } else if (e.key === 'Backspace' && block.content === '') {
      e.preventDefault();
      deleteBlock(blockId);
    } else if ((e.metaKey || e.ctrlKey) && e.key === 's' && onSave) {
      e.preventDefault();
      onSave();
    }
  }, [blocks, addBlock, deleteBlock, onSave]);

  const handleTypeChange = useCallback((blockId: string, newType: BlockType) => {
    updateBlock(blockId, { type: newType });
    setShowBlockMenu(null);
  }, [updateBlock]);

  const renderBlockContent = (block: Block) => {
    const commonProps = {
      ref: (el: HTMLTextAreaElement) => {
        if (el) blockRefs.current.set(block.id, el);
      },
      value: block.content,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => 
        updateBlock(block.id, { content: e.target.value }),
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, block.id),
      onFocus: () => setFocusedBlockId(block.id),
      onBlur: () => setFocusedBlockId(null),
      className: cn(
        "w-full bg-transparent resize-none outline-none border-0 p-0",
        "focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
        readOnly && "cursor-default"
      ),
      readOnly,
      rows: 1,
      style: {
        minHeight: '1.5em',
      },
    };

    switch (block.type) {
      case 'heading1':
        return <textarea {...commonProps} className={cn(commonProps.className, "text-3xl font-bold")} />;
      case 'heading2':
        return <textarea {...commonProps} className={cn(commonProps.className, "text-2xl font-semibold")} />;
      case 'heading3':
        return <textarea {...commonProps} className={cn(commonProps.className, "text-xl font-semibold")} />;
      case 'bulletList':
        return (
          <div className="flex items-start gap-2">
            <span className="mt-2 w-1.5 h-1.5 rounded-full bg-foreground flex-shrink-0" />
            <textarea {...commonProps} />
          </div>
        );
      case 'numberedList':
        const index = blocks.filter((b, i) => i <= blocks.findIndex(x => x.id === block.id) && b.type === 'numberedList').length;
        return (
          <div className="flex items-start gap-2">
            <span className="mt-1 w-6 text-right text-muted-foreground flex-shrink-0">{index}.</span>
            <textarea {...commonProps} />
          </div>
        );
      case 'checkList':
        return (
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={block.checked}
              onChange={(e) => updateBlock(block.id, { checked: e.target.checked })}
              className="mt-1.5 flex-shrink-0"
              disabled={readOnly}
            />
            <textarea {...commonProps} className={cn(commonProps.className, block.checked && "line-through text-muted-foreground")} />
          </div>
        );
      case 'quote':
        return (
          <div className="border-l-4 border-primary pl-4 italic">
            <textarea {...commonProps} />
          </div>
        );
      case 'code':
        return (
          <div className="bg-muted rounded-lg p-4 font-mono text-sm">
            <textarea 
              {...commonProps} 
              className={cn(commonProps.className, "font-mono")}
              style={{ minHeight: '4em' }}
            />
          </div>
        );
      case 'image':
        return block.content ? (
          <img src={block.content} alt="" className="max-w-full rounded-lg" />
        ) : (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center text-muted-foreground">
            <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Image URL or upload coming soon</p>
            {!readOnly && (
              <Input
                placeholder="Paste image URL..."
                className="mt-4 max-w-sm mx-auto"
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              />
            )}
          </div>
        );
      default:
        return <textarea {...commonProps} className={cn(commonProps.className, "text-base")} />;
    }
  };

  if (blocks.length === 0) {
    onChange([{ id: generateId(), type: 'paragraph', content: '' }]);
    return null;
  }

  return (
    <div className="space-y-1">
      {blocks.map((block, index) => (
        <div
          key={block.id}
          className={cn(
            "group relative flex items-start gap-2 py-1 px-2 -mx-2 rounded-lg transition-colors",
            focusedBlockId === block.id && "bg-accent/50",
            !readOnly && "hover:bg-accent/30"
          )}
        >
          {/* Drag Handle & Block Menu */}
          {!readOnly && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu open={showBlockMenu === block.id} onOpenChange={(open) => setShowBlockMenu(open ? block.id : null)}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {(Object.keys(blockLabels) as BlockType[]).map((type) => (
                    <DropdownMenuItem
                      key={type}
                      onClick={() => handleTypeChange(block.id, type)}
                      className="gap-2"
                    >
                      {blockIcons[type]}
                      {blockLabels[type]}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem
                    onClick={() => deleteBlock(block.id)}
                    className="gap-2 text-destructive"
                    disabled={blocks.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => addBlock(block.id)}
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          )}
          
          {/* Block Content */}
          <div className="flex-1 min-w-0">
            {renderBlockContent(block)}
          </div>
        </div>
      ))}
      
      {/* Add block at end */}
      {!readOnly && (
        <div className="flex items-center gap-2 py-2 px-2 -mx-2 opacity-0 hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => addBlock(blocks[blocks.length - 1].id)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Click to add a block</span>
        </div>
      )}
    </div>
  );
}

// Helper function to convert markdown-like text to blocks
export function markdownToBlocks(markdown: string): Block[] {
  const lines = markdown.split('\n');
  const blocks: Block[] = [];
  
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    let type: BlockType = 'paragraph';
    let content = trimmed;
    
    if (trimmed.startsWith('# ')) {
      type = 'heading1';
      content = trimmed.slice(2);
    } else if (trimmed.startsWith('## ')) {
      type = 'heading2';
      content = trimmed.slice(3);
    } else if (trimmed.startsWith('### ')) {
      type = 'heading3';
      content = trimmed.slice(4);
    } else if (trimmed.startsWith('- [ ] ') || trimmed.startsWith('- [x] ')) {
      type = 'checkList';
      content = trimmed.slice(6);
    } else if (trimmed.startsWith('- ')) {
      type = 'bulletList';
      content = trimmed.slice(2);
    } else if (/^\d+\.\s/.test(trimmed)) {
      type = 'numberedList';
      content = trimmed.replace(/^\d+\.\s/, '');
    } else if (trimmed.startsWith('> ')) {
      type = 'quote';
      content = trimmed.slice(2);
    }
    
    blocks.push({
      id: Math.random().toString(36).substr(2, 9),
      type,
      content,
    });
  });
  
  return blocks.length > 0 ? blocks : [{ id: Math.random().toString(36).substr(2, 9), type: 'paragraph', content: '' }];
}

// Helper function to convert blocks to markdown
export function blocksToMarkdown(blocks: Block[]): string {
  return blocks.map(block => {
    switch (block.type) {
      case 'heading1':
        return `# ${block.content}`;
      case 'heading2':
        return `## ${block.content}`;
      case 'heading3':
        return `### ${block.content}`;
      case 'bulletList':
        return `- ${block.content}`;
      case 'numberedList':
        return `1. ${block.content}`;
      case 'checkList':
        return `- [${block.checked ? 'x' : ' '}] ${block.content}`;
      case 'quote':
        return `> ${block.content}`;
      case 'code':
        return `\`\`\`\n${block.content}\n\`\`\``;
      default:
        return block.content;
    }
  }).join('\n\n');
}
