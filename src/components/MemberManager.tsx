
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BsPeople, BsPlus, BsX } from 'react-icons/bs';

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface MemberManagerProps {
  conversationId: string;
  onMembersChange?: () => void;
}

const MemberManager = ({ conversationId, onMembersChange }: MemberManagerProps) => {
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAllProfiles();
      fetchMembers();
    }
  }, [conversationId, isOpen]);

  const fetchAllProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .order('username');

    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }

    setAllProfiles(data || []);
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conversationId);

      if (error) {
        console.error('Error fetching participants:', error);
        return;
      }

      const userIds = data?.map(item => item.user_id) || [];
      
      if (userIds.length === 0) {
        setMembers([]);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching member profiles:', profilesError);
        return;
      }

      setMembers(profilesData || []);
    } catch (err) {
      console.error('Error in fetchMembers:', err);
      setMembers([]);
    }
  };

  const addMember = async (userId: string) => {
    const { error } = await supabase
      .from('conversation_participants')
      .insert({
        conversation_id: conversationId,
        user_id: userId
      });

    if (error) {
      console.error('Error adding member:', error);
      return;
    }

    fetchMembers();
    onMembersChange?.();
  };

  const removeMember = async (userId: string) => {
    const { error } = await supabase
      .from('conversation_participants')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error removing member:', error);
      return;
    }

    fetchMembers();
    onMembersChange?.();
  };

  const filteredProfiles = allProfiles.filter(profile =>
    profile.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !members.find(member => member.id === profile.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="p-1">
          <BsPeople className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Members</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current Members */}
          <div>
            <h4 className="text-sm font-medium mb-2">Current Members ({members.length})</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={member.avatar_url || undefined} />
                      <AvatarFallback className="bg-green-500 text-white text-xs">
                        {member.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{member.username}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMember(member.id)}
                    className="p-1 h-auto"
                  >
                    <BsX className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Members */}
          <div>
            <h4 className="text-sm font-medium mb-2">Add Members</h4>
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2"
            />
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {filteredProfiles.map((profile) => (
                <div key={profile.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="bg-blue-500 text-white text-xs">
                        {profile.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{profile.username}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addMember(profile.id)}
                    className="p-1 h-auto"
                  >
                    <BsPlus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {filteredProfiles.length === 0 && searchQuery && (
                <p className="text-sm text-gray-500 text-center py-2">No users found</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemberManager;
