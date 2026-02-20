 import { useState, useRef, useEffect } from 'react';
 import { Bold, Italic, List, ListOrdered, Link2, Code, Heading1, Heading2, Save, Eye, Edit3 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Textarea } from '@/components/ui/textarea';
 import { Toggle } from '@/components/ui/toggle';
 import { cn } from '@/lib/utils';
 
 interface MarkdownEditorProps {
   content: string;
   onChange: (content: string) => void;
   onSave?: () => void;
   isSaving?: boolean;
   placeholder?: string;
   className?: string;
 }
 
 export function MarkdownEditor({
   content,
   onChange,
   onSave,
   isSaving,
   placeholder = 'Start writing...',
   className,
 }: MarkdownEditorProps) {
   const [isPreview, setIsPreview] = useState(false);
   const textareaRef = useRef<HTMLTextAreaElement>(null);
 
   const insertMarkdown = (before: string, after: string = '') => {
     const textarea = textareaRef.current;
     if (!textarea) return;
 
     const start = textarea.selectionStart;
     const end = textarea.selectionEnd;
     const selectedText = content.substring(start, end);
     const newContent =
       content.substring(0, start) +
       before +
       selectedText +
       after +
       content.substring(end);
     
     onChange(newContent);
     
     // Restore cursor position
     setTimeout(() => {
       textarea.focus();
       textarea.setSelectionRange(
         start + before.length,
         start + before.length + selectedText.length
       );
     }, 0);
   };
 
   const renderMarkdown = (text: string): string => {
     return text
       // Headers
       .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
       .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-6 mb-2">$1</h2>')
       .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
       // Bold and italic
       .replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>')
       .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
       .replace(/\*(.*?)\*/gim, '<em>$1</em>')
       // Code blocks
       .replace(/```([\s\S]*?)```/gim, '<pre class="bg-muted p-3 rounded-md my-2 overflow-x-auto"><code>$1</code></pre>')
       .replace(/`(.*?)`/gim, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
       // Links
       .replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-primary underline" target="_blank">$1</a>')
       // Lists
       .replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="ml-6 list-decimal">$1</li>')
       .replace(/^\s*[-*]\s+(.*$)/gim, '<li class="ml-6 list-disc">$1</li>')
       // Line breaks
       .replace(/\n/gim, '<br />');
   };
 
   return (
     <div className={cn('flex flex-col border rounded-lg overflow-hidden', className)}>
       <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
         <Toggle
           size="sm"
           pressed={!isPreview}
           onPressedChange={() => setIsPreview(false)}
           aria-label="Edit mode"
         >
           <Edit3 className="h-4 w-4" />
         </Toggle>
         <Toggle
           size="sm"
           pressed={isPreview}
           onPressedChange={() => setIsPreview(true)}
           aria-label="Preview mode"
         >
           <Eye className="h-4 w-4" />
         </Toggle>
         
         <div className="h-4 w-px bg-border mx-1" />
         
         {!isPreview && (
           <>
             <Button
               variant="ghost"
               size="sm"
               className="h-8 w-8 p-0"
               onClick={() => insertMarkdown('# ')}
               title="Heading 1"
             >
               <Heading1 className="h-4 w-4" />
             </Button>
             <Button
               variant="ghost"
               size="sm"
               className="h-8 w-8 p-0"
               onClick={() => insertMarkdown('## ')}
               title="Heading 2"
             >
               <Heading2 className="h-4 w-4" />
             </Button>
             <Button
               variant="ghost"
               size="sm"
               className="h-8 w-8 p-0"
               onClick={() => insertMarkdown('**', '**')}
               title="Bold"
             >
               <Bold className="h-4 w-4" />
             </Button>
             <Button
               variant="ghost"
               size="sm"
               className="h-8 w-8 p-0"
               onClick={() => insertMarkdown('*', '*')}
               title="Italic"
             >
               <Italic className="h-4 w-4" />
             </Button>
             <Button
               variant="ghost"
               size="sm"
               className="h-8 w-8 p-0"
               onClick={() => insertMarkdown('- ')}
               title="Bullet list"
             >
               <List className="h-4 w-4" />
             </Button>
             <Button
               variant="ghost"
               size="sm"
               className="h-8 w-8 p-0"
               onClick={() => insertMarkdown('1. ')}
               title="Numbered list"
             >
               <ListOrdered className="h-4 w-4" />
             </Button>
             <Button
               variant="ghost"
               size="sm"
               className="h-8 w-8 p-0"
               onClick={() => insertMarkdown('[', '](url)')}
               title="Link"
             >
               <Link2 className="h-4 w-4" />
             </Button>
             <Button
               variant="ghost"
               size="sm"
               className="h-8 w-8 p-0"
               onClick={() => insertMarkdown('`', '`')}
               title="Inline code"
             >
               <Code className="h-4 w-4" />
             </Button>
           </>
         )}
         
         <div className="flex-1" />
         
         {onSave && (
           <Button size="sm" onClick={onSave} disabled={isSaving}>
             <Save className="h-4 w-4 mr-1" />
             {isSaving ? 'Saving...' : 'Save'}
           </Button>
         )}
       </div>
       
       {isPreview ? (
         <div
           className="p-4 min-h-[300px] prose prose-sm max-w-none dark:prose-invert"
           dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
         />
       ) : (
         <Textarea
           ref={textareaRef}
           value={content}
           onChange={e => onChange(e.target.value)}
           placeholder={placeholder}
           className="min-h-[300px] border-0 rounded-none resize-none focus-visible:ring-0"
         />
       )}
     </div>
   );
 }