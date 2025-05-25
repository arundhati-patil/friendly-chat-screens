
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import LabelManager from './LabelManager';
import MemberManager from './MemberManager';
import { 
  BsThreeDotsVertical, 
  BsSearch, 
  BsPhone, 
  BsCamera,
  BsPaperclip,
  BsEmojiSmile,
  BsMic,
  BsArrowRight,
  BsBookmark,
  BsPersonCheck,
  BsChat
} from 'react-icons/bs';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender: {
    username: string;
    avatar_url: string | null;
  };
}

interface ChatAreaProps {
  conversationId: string | null;
}

const ChatArea = ({ conversationId }: ChatAreaProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationInfo, setConversationInfo] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
      fetchConversationInfo();
      subscribeToMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (!conversationId) return;

    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        sender_id,
        created_at
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    const messagesWithSenders = await Promise.all(
      data.map(async (message) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', message.sender_id)
          .single();

        return {
          ...message,
          sender: profile || { username: 'Unknown', avatar_url: null }
        };
      })
    );

    setMessages(messagesWithSenders);
  };

  const fetchConversationInfo = async () => {
    if (!conversationId || !user) return;

    const { data: conv } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (!conv) return;

    if (!conv.is_group) {
      const { data: participant } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId)
        .neq('user_id', user.id)
        .single();

      if (participant) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, avatar_url, status, last_seen')
          .eq('id', participant.user_id)
          .single();

        setConversationInfo({
          ...conv,
          otherUser: profile
        });
      }
    } else {
      // For group chats, fetch all participants
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select(`
          profiles!inner (
            username,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId);

      setConversationInfo({
        ...conv,
        participants: participants?.map(p => p.profiles) || []
      });
    }
  };

  const subscribeToMessages = () => {
    if (!conversationId) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', payload.new.sender_id)
            .single();

          const newMessage = {
            ...payload.new,
            sender: profile || { username: 'Unknown', avatar_url: null }
          } as Message;

          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversationId || !user) return;

    setLoading(true);

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: newMessage.trim()
      });

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setNewMessage('');
    }

    setLoading(false);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <BsChat className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Chat</h3>
          <p className="text-gray-500">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  const displayName = conversationInfo?.is_group 
    ? conversationInfo.name || 'Group Chat'
    : conversationInfo?.otherUser?.username;

  const participantCount = conversationInfo?.is_group 
    ? conversationInfo.participants?.length || 0
    : 2;

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={conversationInfo?.otherUser?.avatar_url || undefined} />
              <AvatarFallback className="bg-blue-500 text-white">
                {displayName?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-medium text-gray-900 flex items-center space-x-2">
                <span>{displayName || 'Chat'}</span>
                {conversationInfo?.is_group && (
                  <span className="text-sm text-gray-500">({participantCount} members)</span>
                )}
              </h2>
              <p className="text-sm text-gray-500">
                {conversationInfo?.otherUser?.status === 'online' ? 'Online' : 'Last seen recently'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <LabelManager 
              conversationId={conversationId} 
              onLabelsChange={fetchConversationInfo}
            />
            <MemberManager 
              conversationId={conversationId} 
              onMembersChange={fetchConversationInfo}
            />
            <button className="p-2 hover:bg-gray-100 rounded">
              <BsBookmark className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded">
              <BsPersonCheck className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded">
              <BsSearch className="w-4 h-4 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded">
              <BsThreeDotsVertical className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message, index) => {
          const isCurrentUser = message.sender_id === user?.id;
          const showDate = index === 0 || 
            formatDate(messages[index - 1].created_at) !== formatDate(message.created_at);

          return (
            <div key={message.id}>
              {showDate && (
                <div className="text-center my-4">
                  <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm">
                    {formatDate(message.created_at)}
                  </span>
                </div>
              )}
              
              <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start space-x-2 max-w-xs lg:max-w-md ${
                  isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  {!isCurrentUser && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={message.sender.avatar_url || undefined} />
                      <AvatarFallback className="bg-green-500 text-white text-xs">
                        {message.sender.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className="space-y-1">
                    {!isCurrentUser && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-900">
                          {message.sender.username || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(message.created_at)}
                        </span>
                      </div>
                    )}
                    
                    <div className={`px-3 py-2 rounded-lg ${
                      isCurrentUser 
                        ? 'bg-green-500 text-white' 
                        : 'bg-white text-gray-900 shadow-sm border'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                    </div>
                    
                    {isCurrentUser && (
                      <div className="text-right">
                        <span className="text-xs text-gray-500">
                          {formatTime(message.created_at)} ✓✓
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-2 mb-2">
          <button className="text-green-600 text-sm font-medium">WhatsApp</button>
          <button className="text-gray-500 text-sm">Private Note</button>
        </div>
        
        <form onSubmit={sendMessage} className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <div className="flex items-center space-x-2 mb-2">
              <button
                type="button"
                className="p-1 hover:bg-gray-100 rounded text-gray-500"
              >
                <BsPaperclip className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1 hover:bg-gray-100 rounded text-gray-500"
              >
                <BsEmojiSmile className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1 hover:bg-gray-100 rounded text-gray-500"
              >
                <BsCamera className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="p-1 hover:bg-gray-100 rounded text-gray-500"
              >
                <BsMic className="w-4 h-4" />
              </button>
            </div>
            
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="border-gray-300 rounded-lg"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="bg-green-600 hover:bg-green-700 rounded-full w-10 h-10 p-0"
          >
            <BsArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <Avatar className="w-4 h-4">
              <AvatarFallback className="bg-green-500 text-white text-xs">
                {user?.user_metadata?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <span>{user?.user_metadata?.username || 'You'}</span>
          </div>
          <span>⚪</span>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
