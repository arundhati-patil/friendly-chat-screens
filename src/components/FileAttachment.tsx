
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { BsPaperclip, BsImage, BsFileEarmark, BsX } from 'react-icons/bs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface FileAttachmentProps {
  onFileSelect: (file: File, type: 'image' | 'document') => void;
}

const FileAttachment = ({ onFileSelect }: FileAttachmentProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = () => {
    imageInputRef.current?.click();
    setIsOpen(false);
  };

  const handleDocumentSelect = () => {
    documentInputRef.current?.click();
    setIsOpen(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file, 'image');
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file, 'document');
    }
  };

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="p-1">
            <BsPaperclip className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2 bg-white border shadow-lg z-50">
          <div className="space-y-2">
            <button
              onClick={handleImageSelect}
              className="w-full flex items-center space-x-2 p-2 hover:bg-gray-100 rounded text-left"
            >
              <BsImage className="w-4 h-4 text-blue-500" />
              <span className="text-sm">Photo or Video</span>
            </button>
            <button
              onClick={handleDocumentSelect}
              className="w-full flex items-center space-x-2 p-2 hover:bg-gray-100 rounded text-left"
            >
              <BsFileEarmark className="w-4 h-4 text-green-500" />
              <span className="text-sm">Document</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleImageChange}
        className="hidden"
      />
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
        onChange={handleDocumentChange}
        className="hidden"
      />
    </>
  );
};

export default FileAttachment;
