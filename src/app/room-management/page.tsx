'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import toast from 'react-hot-toast';
import { 
  Menu, 
  Home, 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Link,
  Unlink,
  Settings,
  Users,
  Bed
} from 'lucide-react';
import { getRoomGroups } from '@/lib/api/roomGroups';
import { getRoomTypes } from '@/lib/api/roomTypes';
import { getRoomGroupRoomTypes, bulkAssignRoomTypes, deleteRoomGroupRoomType } from '@/lib/api/roomGroupRoomTypes';
import { RoomGroup } from '@/lib/api/roomGroups';
import { RoomType } from '@/lib/api/roomTypes';
import { RoomGroupRoomType } from '@/lib/api/roomGroupRoomTypes';

export default function RoomManagementPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  
  const [roomGroups, setRoomGroups] = useState<RoomGroup[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [relationships, setRelationships] = useState<RoomGroupRoomType[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoomGroup, setSelectedRoomGroup] = useState<number | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningRoomTypes, setAssigningRoomTypes] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      const [roomGroupsRes, roomTypesRes, relationshipsRes] = await Promise.all([
        getRoomGroups(),
        getRoomTypes(),
        getRoomGroupRoomTypes()
      ]);
      
      if (roomGroupsRes.success && roomGroupsRes.data) {
        setRoomGroups(roomGroupsRes.data);
      }
      if (roomTypesRes.success && roomTypesRes.data) {
        setRoomTypes(roomTypesRes.data);
      }
      if (relationshipsRes.success && relationshipsRes.data) {
        setRelationships(relationshipsRes.data);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error(error.message || 'Failed to fetch data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleAssignRoomTypes = async () => {
    if (!selectedRoomGroup || assigningRoomTypes.length === 0) {
      toast.error('Please select a room group and room types');
      return;
    }

    try {
      setSubmitting(true);
      const result = await bulkAssignRoomTypes({
        room_group_id: selectedRoomGroup,
        room_type_ids: assigningRoomTypes
      });
      
      if (result.success) {
        toast.success(result.message || 'Room types assigned successfully');
        setShowAssignModal(false);
        setSelectedRoomGroup(null);
        setAssigningRoomTypes([]);
        fetchData(); // Refresh data
      } else {
        toast.error(result.message || 'Failed to assign room types');
      }
    } catch (error: any) {
      console.error('Error assigning room types:', error);
      toast.error('Failed to assign room types');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveRelationship = async (relationshipId: number) => {
    if (!confirm('Are you sure you want to remove this relationship?')) {
      return;
    }

    try {
      const result = await deleteRoomGroupRoomType(relationshipId);
      
      if (result.success) {
        toast.success(result.message || 'Relationship removed successfully');
        fetchData(); // Refresh data
      } else {
        toast.error(result.message || 'Failed to remove relationship');
      }
    } catch (error: any) {
      console.error('Error removing relationship:', error);
      toast.error('Failed to remove relationship');
    }
  };

  const getRoomTypesForGroup = (roomGroupId: number) => {
    return relationships.filter(rel => rel.room_group_id === roomGroupId);
  };

  const getRoomGroupsForType = (roomTypeId: number) => {
    return relationships.filter(rel => rel.room_type_id === roomTypeId);
  };

  const filteredRoomGroups = roomGroups.filter(group =>
    group.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        <main className="flex-1 overflow-y-auto p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Breadcrumb */}
            <div className="mb-4">
              <nav className="flex items-center text-sm text-gray-500">
                <Home className="w-4 h-4 mr-2" />
                <span>Dashboard</span>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">Room Group Room Types</span>
              </nav>
            </div>
            
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Room Group Room Types</h1>
                  </div>
                </div>
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Link className="w-4 h-4 mr-2" />
                  Assign Room Types
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search room groups..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {/* Room Groups with their assigned Room Types */}
               <div className="bg-white rounded-lg shadow overflow-hidden">
                 <div className="px-6 py-4 border-b border-gray-200">
                   <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                     <Users className="w-5 h-5 mr-2" />
                     Room Groups & Their Types
                   </h2>
                 </div>
                 <div className="divide-y divide-gray-200">
                   {loadingData ? (
                     <div className="p-8 text-center">
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                       <p className="mt-2 text-gray-500">Loading room groups...</p>
                     </div>
                   ) : filteredRoomGroups.length === 0 ? (
                     <div className="p-8 text-center">
                       <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                       <h3 className="text-lg font-medium text-gray-900 mb-2">No room groups found</h3>
                       <p className="text-gray-500">Create room groups first to manage relationships.</p>
                     </div>
                   ) : (
                     filteredRoomGroups.map((group) => {
                       const assignedTypes = getRoomTypesForGroup(group.room_group_id);
                       return (
                         <div key={group.room_group_id} className="p-6">
                           <div className="flex items-center justify-between mb-3">
                             <div>
                               <h3 className="text-lg font-medium text-gray-900">{group.group_name}</h3>
                               {group.description && (
                                 <p className="text-sm text-gray-500 mt-1">{group.description}</p>
                               )}
                             </div>
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                               {assignedTypes.length} types
                             </span>
                           </div>
                           
                           {assignedTypes.length > 0 ? (
                             <div className="space-y-2">
                               {assignedTypes.map((rel) => (
                                 <div key={rel.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                   <div className="flex items-center">
                                     <Bed className="w-4 h-4 text-gray-400 mr-2" />
                                     <div>
                                       <p className="text-sm font-medium text-gray-900">{rel.type_name}</p>
                                       <p className="text-xs text-gray-500">Max: {rel.max_occupancy} guests</p>
                                     </div>
                                   </div>
                                   <button
                                     onClick={() => handleRemoveRelationship(rel.id)}
                                     className="text-red-600 hover:text-red-900 p-1 rounded"
                                     title="Remove relationship"
                                   >
                                     <Unlink className="w-4 h-4" />
                                   </button>
                                 </div>
                               ))}
                             </div>
                           ) : (
                             <p className="text-sm text-gray-500 italic">No room types assigned</p>
                           )}
                         </div>
                       );
                     })
                   )}
                 </div>
               </div>

               {/* Room Types with their assigned Room Groups */}
               <div className="bg-white rounded-lg shadow overflow-hidden">
                 <div className="px-6 py-4 border-b border-gray-200">
                   <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                     <Bed className="w-5 h-5 mr-2" />
                     Room Types & Their Groups
                   </h2>
                 </div>
                 <div className="divide-y divide-gray-200">
                   {loadingData ? (
                     <div className="p-8 text-center">
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                       <p className="mt-2 text-gray-500">Loading room types...</p>
                     </div>
                   ) : roomTypes.length === 0 ? (
                     <div className="p-8 text-center">
                       <Bed className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                       <h3 className="text-lg font-medium text-gray-900 mb-2">No room types found</h3>
                       <p className="text-gray-500">Create room types first to manage relationships.</p>
                     </div>
                   ) : (
                     roomTypes.map((type) => {
                       const assignedGroups = getRoomGroupsForType(type.room_type_id);
                       return (
                         <div key={type.room_type_id} className="p-6">
                           <div className="flex items-center justify-between mb-3">
                             <div>
                               <h3 className="text-lg font-medium text-gray-900">{type.type_name}</h3>
                               {type.description && (
                                 <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                               )}
                               <p className="text-xs text-gray-500 mt-1">Max occupancy: {type.max_occupancy} guests</p>
                             </div>
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                               {assignedGroups.length} groups
                             </span>
                           </div>
                           
                           {assignedGroups.length > 0 ? (
                             <div className="space-y-2">
                               {assignedGroups.map((rel) => (
                                 <div key={rel.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                                   <Users className="w-4 h-4 text-gray-400 mr-2" />
                                   <div>
                                     <p className="text-sm font-medium text-gray-900">{rel.group_name}</p>
                                     {rel.group_description && (
                                       <p className="text-xs text-gray-500">{rel.group_description}</p>
                                     )}
                                   </div>
                                 </div>
                               ))}
                             </div>
                           ) : (
                             <p className="text-sm text-gray-500 italic">Not assigned to any room group</p>
                           )}
                         </div>
                       );
                     })
                   )}
                 </div>
               </div>
             </div>
          </div>
        </main>
      </div>

      {/* Assign Room Types Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Assign Room Types</h2>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedRoomGroup(null);
                  setAssigningRoomTypes([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Room Group
                </label>
                <select
                  value={selectedRoomGroup || ''}
                  onChange={(e) => setSelectedRoomGroup(Number(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a room group</option>
                  {roomGroups.map(group => (
                    <option key={group.room_group_id} value={group.room_group_id}>
                      {group.group_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Room Types
                </label>
                <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-2">
                  {roomTypes.map(type => (
                    <label key={type.room_type_id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                      <input
                        type="checkbox"
                        checked={assigningRoomTypes.includes(type.room_type_id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssigningRoomTypes(prev => [...prev, type.room_type_id]);
                          } else {
                            setAssigningRoomTypes(prev => prev.filter(id => id !== type.room_type_id));
                          }
                        }}
                        className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{type.type_name}</p>
                        <p className="text-xs text-gray-500">Max: {type.max_occupancy} guests</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedRoomGroup(null);
                  setAssigningRoomTypes([]);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignRoomTypes}
                disabled={submitting || !selectedRoomGroup || assigningRoomTypes.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Assigning...
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4 mr-2" />
                    Assign Room Types
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
