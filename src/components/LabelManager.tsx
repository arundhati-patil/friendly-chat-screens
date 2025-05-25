
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BsPlus, BsX, BsTag } from 'react-icons/bs';

interface Label {
  id: string;
  name: string;
  color: string;
}

interface LabelManagerProps {
  conversationId: string;
  onLabelsChange?: () => void;
}

const LabelManager = ({ conversationId, onLabelsChange }: LabelManagerProps) => {
  const [labels, setLabels] = useState<Label[]>([]);
  const [conversationLabels, setConversationLabels] = useState<Label[]>([]);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3B82F6');
  const [isOpen, setIsOpen] = useState(false);

  const colors = [
    '#EF4444', '#3B82F6', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
  ];

  useEffect(() => {
    fetchLabels();
    fetchConversationLabels();
  }, [conversationId]);

  const fetchLabels = async () => {
    const { data, error } = await supabase
      .from('chat_labels')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching labels:', error);
      return;
    }

    setLabels(data || []);
  };

  const fetchConversationLabels = async () => {
    const { data, error } = await supabase
      .from('conversation_labels')
      .select(`
        id,
        chat_labels!inner (
          id,
          name,
          color
        )
      `)
      .eq('conversation_id', conversationId);

    if (error) {
      console.error('Error fetching conversation labels:', error);
      return;
    }

    setConversationLabels(data?.map(item => item.chat_labels) || []);
  };

  const createLabel = async () => {
    if (!newLabelName.trim()) return;

    const { error } = await supabase
      .from('chat_labels')
      .insert({
        name: newLabelName.trim(),
        color: newLabelColor
      });

    if (error) {
      console.error('Error creating label:', error);
      return;
    }

    setNewLabelName('');
    setNewLabelColor('#3B82F6');
    fetchLabels();
  };

  const addLabelToConversation = async (labelId: string) => {
    const { error } = await supabase
      .from('conversation_labels')
      .insert({
        conversation_id: conversationId,
        label_id: labelId
      });

    if (error) {
      console.error('Error adding label to conversation:', error);
      return;
    }

    fetchConversationLabels();
    onLabelsChange?.();
  };

  const removeLabelFromConversation = async (labelId: string) => {
    const { error } = await supabase
      .from('conversation_labels')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('label_id', labelId);

    if (error) {
      console.error('Error removing label from conversation:', error);
      return;
    }

    fetchConversationLabels();
    onLabelsChange?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="p-1">
          <BsTag className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Labels</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Labels */}
          <div>
            <h4 className="text-sm font-medium mb-2">Current Labels</h4>
            <div className="flex flex-wrap gap-2">
              {conversationLabels.map((label) => (
                <span
                  key={label.id}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: label.color }}
                >
                  {label.name}
                  <button
                    onClick={() => removeLabelFromConversation(label.id)}
                    className="hover:bg-black/20 rounded-full p-0.5"
                  >
                    <BsX className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Available Labels */}
          <div>
            <h4 className="text-sm font-medium mb-2">Available Labels</h4>
            <div className="flex flex-wrap gap-2">
              {labels
                .filter(label => !conversationLabels.find(cl => cl.id === label.id))
                .map((label) => (
                  <button
                    key={label.id}
                    onClick={() => addLabelToConversation(label.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white hover:opacity-80"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                    <BsPlus className="w-3 h-3" />
                  </button>
                ))}
            </div>
          </div>

          {/* Create New Label */}
          <div>
            <h4 className="text-sm font-medium mb-2">Create New Label</h4>
            <div className="space-y-2">
              <Input
                placeholder="Label name"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm">Color:</span>
                <div className="flex gap-1">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewLabelColor(color)}
                      className={`w-6 h-6 rounded-full border-2 ${
                        newLabelColor === color ? 'border-gray-400' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={createLabel} size="sm" className="w-full">
                Create Label
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LabelManager;
