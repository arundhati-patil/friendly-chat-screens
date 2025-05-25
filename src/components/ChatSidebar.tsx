
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  BsThreeDotsVertical, 
  BsChat, 
  BsArchive, 
  BsSearch,
  BsHouse,
  BsPencilSquare,
  BsBarChart,
  BsPeople,
  BsGear,
  BsFilter,
  BsBookmark,
  BsPlus,
  BsX
} from 'react-icons/bs';

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Conversation {
  id: string;
  name: string | null;
  is_group: boolean;
  avatar_url: string | null;
  updated_at: string;
  lastMessage?: {
    content: string;
    created_at: string;
    sender: {
      username: string;
    };
  };
  otherUser?: {
    username: string;
    avatar_url: string | null;
    status: string;
  };
  labels?: Label[];
}

interface ChatSidebarProps {
  selectedConversation: string | null;
  onSelectConversation: (conversationId: string) => void;
}

const ChatSidebar = ({ selectedConversation, onSelectConversation }: ChatSidebarProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchLabels();
    }
  }, [user]);

  const fetchLabels = async () => {
    try {
      const { data, error } = await supabase.rpc('get_chat_labels');

      if (error) {
        console.error('Error fetching labels:', error);
        setAvailableLabels([]);
        return;
      }

      setAvailableLabels(data || []);
    } catch (err) {
      console.error('Error fetching labels:', err);
      setAvailableLabels([]);
    }
  };

  const fetchConversations = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversations!inner (
          id,
          name,
          is_group,
          avatar_url,
          updated_at
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }

    const conversationPromises = data.map(async (item) => {
      const conv = item.conversations;
      
      // Fetch last message
      const { data: lastMessageData } = await supabase
        .from('messages')
        .select('content, created_at, sender_id')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let lastMessage = undefined;
      if (lastMessageData) {
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', lastMessageData.sender_id)
          .single();

        lastMessage = {
          content: lastMessageData.content,
          created_at: lastMessageData.created_at,
          sender: senderProfile || { username: 'Unknown' }
        };
      }

      // Fetch other user info for direct chats
      let otherUser = null;
      if (!conv.is_group) {
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conv.id)
          .neq('user_id', user.id)
          .limit(1)
          .single();

        if (participants) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url, status')
            .eq('id', participants.user_id)
            .single();

          otherUser = profile;
        }
      }

      // Try to fetch labels, but handle gracefully if functions don't exist
      let labels: Label[] = [];
      try {
        const { data: labelData } = await supabase.rpc('get_conversation_labels', { 
          conversation_id: conv.id 
        });
        
        labels = labelData || [];
      } catch (err) {
        console.log('Labels not available yet');
        labels = [];
      }

      return {
        ...conv,
        lastMessage,
        otherUser,
        labels
      };
    });

    const conversationsWithDetails = await Promise.all(conversationPromises);
    setConversations(conversationsWithDetails);
  };

  const createNewConversation = async () => {
    if (!user) return;

    // For demo purposes, create a conversation with a random existing user
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .neq('id', user.id)
      .limit(1);

    if (!profiles || profiles.length === 0) return;

    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({
        is_group: false
      })
      .select()
      .single();

    if (convError) {
      console.error('Error creating conversation:', convError);
      return;
    }

    // Add participants
    const { error: participantError } = await supabase
      .from('conversation_participants')
      .insert([
        { conversation_id: newConv.id, user_id: user.id },
        { conversation_id: newConv.id, user_id: profiles[0].id }
      ]);

    if (participantError) {
      console.error('Error adding participants:', participantError);
      return;
    }

    fetchConversations();
    onSelectConversation(newConv.id);
  };

  const toggleLabelFilter = (labelId: string) => {
    setSelectedLabels(prev => 
      prev.includes(labelId) 
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  const clearFilters = () => {
    setSelectedLabels([]);
    setActiveFilter('all');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const displayName = conv.is_group ? conv.name : conv.otherUser?.username;
    const matchesSearch = displayName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLabels = selectedLabels.length === 0 || 
      selectedLabels.some(labelId => conv.labels?.some(label => label.id === labelId));

    return matchesSearch && matchesLabels;
  });

  return (
    <div className="flex h-full bg-white">
      {/* Left Navigation Sidebar */}
      <div className="w-16 bg-green-600 flex flex-col items-center py-4 space-y-6">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
          <BsChat className="w-4 h-4 text-green-600" />
        </div>
        
        <div className="flex flex-col space-y-4">
          <button className="p-2 text-white hover:bg-green-700 rounded">
            <BsHouse className="w-5 h-5" />
          </button>
          <button className="p-2 text-white hover:bg-green-700 rounded bg-green-700">
            <BsChat className="w-5 h-5" />
          </button>
          <button className="p-2 text-white hover:bg-green-700 rounded">
            <BsPencilSquare className="w-5 h-5" />
          </button>
          <button className="p-2 text-white hover:bg-green-700 rounded">
            <BsBarChart className="w-5 h-5" />
          </button>
          <button className="p-2 text-white hover:bg-green-700 rounded">
            <BsPeople className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1"></div>

        <div className="flex flex-col space-y-4">
          <button className="p-2 text-white hover:bg-green-700 rounded">
            <BsGear className="w-5 h-5" />
          </button>
          <button 
            onClick={signOut}
            className="w-8 h-8 bg-white rounded-full flex items-center justify-center"
          >
            <span className="text-xs font-semibold text-green-600">
              {user?.user_metadata?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </button>
        </div>
      </div>

      {/* Chat List Sidebar */}
      <div className="w-80 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Chats</h1>
            <div className="flex items-center space-x-2">
              <Button
                onClick={createNewConversation}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <BsPlus className="w-4 h-4" />
              </Button>
              <button className="text-green-600 text-sm">Refresh</button>
              <button className="text-green-600 text-sm">Help</button>
            </div>
          </div>
          
          {/* Filter and Search */}
          <div className="flex items-center space-x-2 mb-3">
            <button 
              className={`flex items-center space-x-1 px-3 py-1 rounded text-sm ${
                showFilters ? 'bg-green-100 text-green-700' : 'text-gray-600'
              }`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <BsFilter className="w-4 h-4" />
              <span>Filters</span>
            </button>
            {(selectedLabels.length > 0) && (
              <button 
                onClick={clearFilters}
                className="text-green-600 text-sm"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mb-3 p-3 bg-gray-50 rounded">
              <h4 className="text-sm font-medium mb-2">Filter by Labels</h4>
              <div className="flex flex-wrap gap-2">
                {availableLabels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => toggleLabelFilter(label.id)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white transition-opacity ${
                      selectedLabels.includes(label.id) ? 'opacity-100' : 'opacity-60'
                    }`}
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                    {selectedLabels.includes(label.id) && <BsX className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="relative">
            <BsSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-300"
            />
          </div>

          <div className="flex items-center space-x-2 mt-3">
            <span className="text-sm text-gray-600">Total</span>
            <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-semibold">{filteredConversations.length}</span>
            </div>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((conversation) => {
            const displayName = conversation.is_group ? conversation.name : conversation.otherUser?.username;
            const avatarUrl = conversation.is_group ? conversation.avatar_url : conversation.otherUser?.avatar_url;
            const isOnline = conversation.otherUser?.status === 'online';
            
            return (
              <div
                key={conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
                className={`p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                  selectedConversation === conversation.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="relative">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="bg-green-500 text-white text-sm">
                        {displayName?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    {!conversation.is_group && isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {displayName || 'Unknown User'}
                      </h3>
                      {conversation.lastMessage && (
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    
                    {/* Labels */}
                    {conversation.labels && conversation.labels.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-1">
                        {conversation.labels.slice(0, 2).map((label) => (
                          <span
                            key={label.id}
                            className="inline-block px-1.5 py-0.5 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: label.color }}
                          >
                            {label.name}
                          </span>
                        ))}
                        {conversation.labels.length > 2 && (
                          <span className="text-xs text-gray-500">+{conversation.labels.length - 2}</span>
                        )}
                      </div>
                    )}
                    
                    {conversation.lastMessage && (
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage.sender.username}: {conversation.lastMessage.content}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {conversation.otherUser?.status || 'offline'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredConversations.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              {searchQuery || selectedLabels.length > 0 ? 'No matching conversations' : 'No conversations yet'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
