
export const sampleUsers = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    username: 'Alice Johnson',
    avatar_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    status: 'online'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    username: 'Bob Smith',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    status: 'offline'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    username: 'Carol Wilson',
    avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    status: 'online'
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    username: 'David Brown',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    status: 'offline'
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    username: 'Emma Davis',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    status: 'online'
  }
];

export const sampleConversations = [
  {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: null,
    is_group: false,
    avatar_url: null,
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    otherUser: sampleUsers[0],
    lastMessage: {
      content: 'Just finished a great book 📚',
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      sender: { username: 'Alice Johnson' }
    },
    labels: []
  },
  {
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    name: null,
    is_group: false,
    avatar_url: null,
    updated_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
    otherUser: sampleUsers[1],
    lastMessage: {
      content: 'Are we still on for the meeting today?',
      created_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
      sender: { username: 'Bob Smith' }
    },
    labels: []
  },
  {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    name: 'Team Chat',
    is_group: true,
    avatar_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&h=150&fit=crop',
    updated_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    participants: [sampleUsers[0], sampleUsers[2], sampleUsers[4]],
    lastMessage: {
      content: 'Let\'s schedule our first team meeting',
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      sender: { username: 'Carol Wilson' }
    },
    labels: []
  }
];

export const sampleMessages = [
  // Alice conversation
  {
    id: 'msg-1',
    content: 'Hey! How are you doing? 😊',
    sender_id: '11111111-1111-1111-1111-111111111111',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    sender: sampleUsers[0]
  },
  {
    id: 'msg-2',
    content: 'I wanted to share something exciting with you!',
    sender_id: '11111111-1111-1111-1111-111111111111',
    created_at: new Date(Date.now() - 1.75 * 60 * 60 * 1000).toISOString(),
    sender: sampleUsers[0]
  },
  {
    id: 'msg-3',
    content: 'Just finished a great book 📚',
    sender_id: '11111111-1111-1111-1111-111111111111',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    sender: sampleUsers[0]
  }
];

export const getSampleConversationMessages = (conversationId: string) => {
  switch (conversationId) {
    case 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa':
      return [
        {
          id: 'msg-1',
          content: 'Hey! How are you doing? 😊',
          sender_id: '11111111-1111-1111-1111-111111111111',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          sender: sampleUsers[0]
        },
        {
          id: 'msg-2',
          content: 'I wanted to share something exciting with you!',
          sender_id: '11111111-1111-1111-1111-111111111111',
          created_at: new Date(Date.now() - 1.75 * 60 * 60 * 1000).toISOString(),
          sender: sampleUsers[0]
        },
        {
          id: 'msg-3',
          content: 'Just finished a great book 📚',
          sender_id: '11111111-1111-1111-1111-111111111111',
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          sender: sampleUsers[0]
        }
      ];
    case 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb':
      return [
        {
          id: 'msg-4',
          content: 'Good morning! ☀️',
          sender_id: '22222222-2222-2222-2222-222222222222',
          created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          sender: sampleUsers[1]
        },
        {
          id: 'msg-5',
          content: 'Are we still on for the meeting today?',
          sender_id: '22222222-2222-2222-2222-222222222222',
          created_at: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString(),
          sender: sampleUsers[1]
        }
      ];
    case 'cccccccc-cccc-cccc-cccc-cccccccccccc':
      return [
        {
          id: 'msg-6',
          content: 'Welcome everyone to our team chat! 🎉',
          sender_id: '33333333-3333-3333-3333-333333333333',
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          sender: sampleUsers[2]
        },
        {
          id: 'msg-7',
          content: 'Thanks Carol! Excited to be here 🚀',
          sender_id: '11111111-1111-1111-1111-111111111111',
          created_at: new Date(Date.now() - 4.5 * 60 * 60 * 1000).toISOString(),
          sender: sampleUsers[0]
        },
        {
          id: 'msg-8',
          content: 'Looking forward to working together! 💪',
          sender_id: '55555555-5555-5555-5555-555555555555',
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          sender: sampleUsers[4]
        },
        {
          id: 'msg-9',
          content: 'Let\'s schedule our first team meeting',
          sender_id: '33333333-3333-3333-3333-333333333333',
          created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          sender: sampleUsers[2]
        }
      ];
    default:
      return [];
  }
};
