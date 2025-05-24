
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BsThreeDotsVertical, BsSearch, BsPhone, BsCamera } from 'react-icons/bs';
import { IoMdSend, IoMdAttach, IoMdMic } from 'react-icons/io';
import { MdEmojiEmotions } from 'react-icons/md';

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
        created_at,
        profiles!messages_sender_id_fkey (
          username,
          avatar_url
        )
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return;
    }

    setMessages(data.map(msg => ({
      ...msg,
      sender: msg.profiles
    })));
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
      // Get other user info for direct messages
      const { data: participant } = await supabase
        .from('conversation_participants')
        .select(`
          profiles!conversation_participants_user_id_fkey (
            username,
            avatar_url,
            status,
            last_seen
          )
        `)
        .eq('conversation_id', conversationId)
        .neq('user_id', user.id)
        .single();

      setConversationInfo({
        ...conv,
        otherUser: participant?.profiles
      });
    } else {
      setConversationInfo(conv);
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
          const { data: newMessage } = await supabase
            .from('messages')
            .select(`
              id,
              content,
              sender_id,
              created_at,
              profiles!messages_sender_id_fkey (
                username,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (newMessage) {
            setMessages(prev => [...prev, {
              ...newMessage,
              sender: newMessage.profiles
            }]);
          }
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
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <BsThreeDotsVertical className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome to Chat</h3>
          <p className="text-gray-500">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  const displayName = conversationInfo?.is_group 
    ? conversationInfo.name 
    : conversationInfo?.otherUser?.username;

  const isOnline = conversationInfo?.otherUser?.status === 'online';

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage src={conversationInfo?.otherUser?.avatar_url || undefined} />
                <AvatarFallback className="bg-green-500 text-white">
                  {displayName?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              {!conversationInfo?.is_group && isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div>
              <h2 className="font-medium text-gray-900">{displayName || 'Unknown User'}</h2>
              {!conversationInfo?.is_group && (
                <p className="text-sm text-gray-500">
                  {isOnline ? 'Online' : 'Last seen recently'}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <BsCamera className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <BsPhone className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <BsSearch className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <BsThreeDotsVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4 space-y-4">
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
                <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
                  isCurrentUser ? 'flex-row-reverse space-x-reverse' : ''
                }`}>
                  {!isCurrentUser && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={message.sender.avatar_url || undefined} />
                      <AvatarFallback className="bg-gray-500 text-white text-xs">
                        {message.sender.username?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`px-4 py-2 rounded-lg ${
                    isCurrentUser 
                      ? 'bg-green-500 text-white' 
                      : 'bg-white text-gray-900 shadow-sm'
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      isCurrentUser ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.created_at)}
                    </p>
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
        <form onSubmit={sendMessage} className="flex items-center space-x-2">
          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
          >
            <MdEmojiEmotions className="w-6 h-6" />
          </button>
          
          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
          >
            <IoMdAttach className="w-6 h-6" />
          </button>

          <div className="flex-1 relative">
            <Input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="pr-12 rounded-full border-gray-300"
              disabled={loading}
            />
            {!newMessage.trim() && (
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                <IoMdMic className="w-5 h-5" />
              </button>
            )}
          </div>

          {newMessage.trim() && (
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 rounded-full w-10 h-10 p-0"
            >
              <IoMdSend className="w-5 h-5" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ChatArea;
