import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  UserPlus,
  Mail,
  Phone,
  Calendar
} from 'lucide-react';

interface Team {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  member_count: number;
}

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  hourly_rate: number;
  joined_at: string;
  is_active: boolean;
}

export function AdminTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', description: '' });
  const [newMember, setNewMember] = useState({ 
    email: '', 
    role: 'developer', 
    hourly_rate: 0 
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          description,
          is_active,
          created_at,
          team_members(id)
        `)
        .eq('is_active', true);

      if (error) throw error;

      const teamsWithCount = data?.map((team: any) => ({
        ...team,
        member_count: team.team_members?.length || 0
      })) || [];

      setTeams(teamsWithCount);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          id,
          role,
          hourly_rate,
          joined_at,
          is_active,
          user_profiles(full_name),
          auth_users(email)
        `)
        .eq('team_id', teamId)
        .eq('is_active', true);

      if (error) throw error;

      const members = data?.map((member: any) => ({
        id: member.id,
        full_name: member.user_profiles?.full_name || 'Unknown',
        email: member.auth_users?.email || 'Unknown',
        role: member.role,
        hourly_rate: member.hourly_rate,
        joined_at: member.joined_at,
        is_active: member.is_active
      })) || [];

      setTeamMembers(members);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const createTeam = async () => {
    try {
      const { error } = await supabase
        .from('teams')
        .insert({
          name: newTeam.name,
          description: newTeam.description,
        });

      if (error) throw error;

      setShowCreateTeam(false);
      setNewTeam({ name: '', description: '' });
      fetchTeams();
    } catch (error) {
      console.error('Error creating team:', error);
    }
  };

  const addTeamMember = async () => {
    try {
      // First, find the user by email
      const { data: userData, error: userError } = await supabase
        .from('auth_users')
        .select('id')
        .eq('email', newMember.email)
        .single();

      if (userError || !userData) {
        throw new Error('User not found with this email');
      }

      // Add user to team
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: selectedTeam?.id,
          user_id: userData.id,
          role: newMember.role,
          hourly_rate: newMember.hourly_rate,
        });

      if (error) throw error;

      setShowAddMember(false);
      setNewMember({ email: '', role: 'developer', hourly_rate: 0 });
      if (selectedTeam) {
        fetchTeamMembers(selectedTeam.id);
      }
    } catch (error) {
      console.error('Error adding team member:', error);
    }
  };

  const removeTeamMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ is_active: false })
        .eq('id', memberId);

      if (error) throw error;

      if (selectedTeam) {
        fetchTeamMembers(selectedTeam.id);
      }
    } catch (error) {
      console.error('Error removing team member:', error);
    }
  };

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team);
    fetchTeamMembers(team.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600">Manage your teams and team members</p>
        </div>
        <button 
          onClick={() => setShowCreateTeam(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Team
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Teams</h3>
              <p className="text-sm text-gray-600">Select a team to view members</p>
            </div>
            <div className="space-y-3">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTeam?.id === team.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleTeamSelect(team)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{team.name}</h3>
                      <p className="text-sm text-gray-600">{team.description}</p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full border border-gray-300 text-gray-700">
                      {team.member_count} members
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedTeam ? `${selectedTeam.name} Members` : 'Select a Team'}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedTeam ? 'Manage team members and their roles' : 'Choose a team to view members'}
                </p>
              </div>
              {selectedTeam && (
                <button 
                  onClick={() => setShowAddMember(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center text-sm"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Member
                </button>
              )}
            </div>
            
            {selectedTeam ? (
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{member.full_name}</h4>
                        <p className="text-sm text-gray-500">{member.email}</p>
                        <p className="text-xs text-gray-400">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="px-2 py-1 text-xs rounded-full border border-gray-300 text-gray-700">
                        {member.role}
                      </span>
                      <span className="text-sm text-gray-600">
                        ${member.hourly_rate}/hr
                      </span>
                      <button
                        onClick={() => removeTeamMember(member.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {teamMembers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No members in this team yet.</p>
                    <p className="text-sm">Add members to get started.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Select a team to view and manage members</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Team</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Name
                </label>
                <input
                  type="text"
                  value={newTeam.name}
                  onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  placeholder="Enter team name"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newTeam.description}
                  onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                  placeholder="Enter team description"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCreateTeam(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createTeam}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add Team Member</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="Enter member's email"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="developer">Developer</option>
                  <option value="senior">Senior Developer</option>
                  <option value="lead">Team Lead</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  value={newMember.hourly_rate}
                  onChange={(e) => setNewMember({ ...newMember, hourly_rate: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter hourly rate"
                  className="w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddMember(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addTeamMember}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Add Member
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
