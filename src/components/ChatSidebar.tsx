import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { BsThreeDotsVertical, BsChat, BsArchive, BsPin, BsSearch } from 'react-icons/bs';
import { IoMdAdd } from 'react-icons/io';

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
}

interface ChatSidebarProps {
  selectedConversation: string | null;
  onSelectConversation: (conversationId: string) => void;
}

const ChatSidebar = ({ selectedConversation, onSelectConversation }: ChatSidebarProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

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

    // Get conversation details with last messages
    const conversationPromises = data.map(async (item) => {
      const conv = item.conversations;
      
      // Get last message
      const { data: lastMessageData } = await supabase
        .from('messages')
        .select('content, created_at, sender_id')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      let lastMessage = undefined;
      if (lastMessageData) {
        // Get sender profile for the last message
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

      // For direct messages, get the other user
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

      return {
        ...conv,
        lastMessage,
        otherUser
      };
    });

    const conversationsWithDetails = await Promise.all(conversationPromises);
    setConversations(conversationsWithDetails);
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
    return displayName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Chats</h1>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <IoMdAdd className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <BsThreeDotsVertical className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <BsSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-50 border-none"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex space-x-4 mt-4">
          <button className="flex items-center space-x-2 text-green-600 border-b-2 border-green-600 pb-2">
            <BsChat className="w-4 h-4" />
            <span className="text-sm font-medium">All</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-500 pb-2">
            <BsArchive className="w-4 h-4" />
            <span className="text-sm">Archived</span>
          </button>
          <button className="flex items-center space-x-2 text-gray-500 pb-2">
            <BsPin className="w-4 h-4" />
            <span className="text-sm">Pinned</span>
          </button>
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
              className={`p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
                selectedConversation === conversation.id ? 'bg-gray-50' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={avatarUrl || undefined} />
                    <AvatarFallback className="bg-green-500 text-white">
                      {displayName?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {!conversation.is_group && isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {displayName || 'Unknown User'}
                    </h3>
                    {conversation.lastMessage && (
                      <span className="text-xs text-gray-500 ml-2">
                        {formatTime(conversation.lastMessage.created_at)}
                      </span>
                    )}
                  </div>
                  
                  {conversation.lastMessage && (
                    <div className="flex items-center mt-1">
                      <p className="text-sm text-gray-500 truncate">
                        {conversation.lastMessage.sender.username === user?.user_metadata?.username ? 'You: ' : ''}
                        {conversation.lastMessage.content}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Profile at bottom */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-blue-500 text-white">
                {user?.user_metadata?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{user?.user_metadata?.username || 'User'}</p>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;
