'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import Sidebar from '@/components/Sidebar';
import { 
  Menu, 
  Home, 
  LayoutDashboard, 
  Users, 
  Bed, 
  Calendar, 
  DollarSign,
  TrendingUp,
  Activity,
  Hotel,
  UserCheck
} from 'lucide-react';
import { getReservations } from '@/lib/api/reservations';
import { getRooms } from '@/lib/api/rooms';
import { getGuests } from '@/lib/api/guests';
import { getRoomPricing } from '@/lib/api/roomPricing';
import { getRoomTypes } from '@/lib/api/roomTypes';
import { StatCard, SimpleBarChart, PieChart } from '@/components/DashboardCharts';
import toast from 'react-hot-toast';

interface DashboardStats {
  totalReservations: number;
  activeReservations: number;
  totalRooms: number;
  occupiedRooms: number;
  totalGuests: number;
  totalRevenue: number;
  occupancyRate: number;
  averageRoomPrice: number;
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalReservations: 0,
    activeReservations: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    totalGuests: 0,
    totalRevenue: 0,
    occupancyRate: 0,
    averageRoomPrice: 0
  });
  
  const [reservationStatusData, setReservationStatusData] = useState<ChartData[]>([]);
  const [roomTypeData, setRoomTypeData] = useState<ChartData[]>([]);
  const [monthlyReservations, setMonthlyReservations] = useState<ChartData[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoadingData(true);
      
      // Fetch all data in parallel
      const [reservationsRes, roomsRes, guestsRes, pricingRes, roomTypesRes] = await Promise.all([
        getReservations(),
        getRooms(),
        getGuests(),
        getRoomPricing(),
        getRoomTypes()
      ]);

      if (reservationsRes.success && reservationsRes.data) {
        const reservations = reservationsRes.data;
        const totalReservations = reservations.length;
        const activeReservations = reservations.filter(r => 
          r.status === 'confirmed'
        ).length;

        // Calculate reservation status distribution
        const statusCounts = reservations.reduce((acc: any, reservation) => {
          acc[reservation.status] = (acc[reservation.status] || 0) + 1;
          return acc;
        }, {});

        const statusData = Object.entries(statusCounts).map(([status, count]) => ({
          name: status.charAt(0).toUpperCase() + status.slice(1),
          value: count as number,
          color: getStatusColor(status)
        }));

        setReservationStatusData(statusData);

        // Calculate monthly reservations (last 6 months)
        const monthlyData = calculateMonthlyReservations(reservations);
        setMonthlyReservations(monthlyData);

        setStats(prev => ({
          ...prev,
          totalReservations,
          activeReservations
        }));
      }

      if (roomsRes.success && roomsRes.data) {
        const rooms = roomsRes.data;
        const totalRooms = rooms.length;
        const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
        const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

        setStats(prev => ({
          ...prev,
          totalRooms,
          occupiedRooms,
          occupancyRate
        }));
      }

      if (guestsRes.success && guestsRes.data) {
        const totalGuests = guestsRes.data.length;
        setStats(prev => ({
          ...prev,
          totalGuests
        }));
      }

      if (pricingRes.success && pricingRes.data) {
        const pricing = pricingRes.data;
        const totalRevenue = pricing.reduce((sum, price) => sum + (Number(price.price) || 0), 0);
        const averageRoomPrice = pricing.length > 0 ? totalRevenue / pricing.length : 0;

        setStats(prev => ({
          ...prev,
          totalRevenue,
          averageRoomPrice
        }));
      }

      if (roomTypesRes.success && roomTypesRes.data) {
        const roomTypes = roomTypesRes.data;
        const typeData = roomTypes.map(type => ({
          name: type.type_name,
          value: type.max_occupancy || 0,
          color: getRandomColor()
        }));

        setRoomTypeData(typeData);
      }

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoadingData(false);
    }
  };

  const calculateMonthlyReservations = (reservations: any[]): ChartData[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    
    const monthlyCounts = new Array(6).fill(0);
    
    reservations.forEach(reservation => {
      const reservationDate = new Date(reservation.check_in_date);
      const monthDiff = currentMonth - reservationDate.getMonth();
      
      if (monthDiff >= 0 && monthDiff < 6) {
        monthlyCounts[monthDiff]++;
      }
    });

    return monthlyCounts.map((count, index) => ({
      name: months[(currentMonth - index + 12) % 12],
      value: count,
      color: '#3B82F6'
    })).reverse();
  };

  const getStatusColor = (status: string): string => {
    const colors: { [key: string]: string } = {
      confirmed: '#10B981',
      completed: '#6B7280',
      cancelled: '#EF4444'
    };
    return colors[status] || '#6B7280';
  };

  const getRandomColor = (): string => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
    return colors[Math.floor(Math.random() * colors.length)];
  };



  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-4">
              <nav className="flex items-center text-sm text-gray-500">
                <Home className="w-4 h-4 mr-2" />
                <span className="text-gray-900 font-medium">Dashboard</span>
              </nav>
            </div>
            
            {/* Page Title */}
            <div className="mb-8">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                  <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                </div>
              </div>
            </div>

            {loadingData ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <StatCard
                    title="Total Reservations"
                    value={stats.totalReservations}
                    icon={Calendar}
                    color="blue"
                  />
                  <StatCard
                    title="Active Reservations"
                    value={stats.activeReservations}
                    icon={Activity}
                    color="green"
                  />
                  <StatCard
                    title="Total Rooms"
                    value={stats.totalRooms}
                    icon={Bed}
                    color="purple"
                  />
                  <StatCard
                    title="Occupancy Rate"
                    value={`${stats.occupancyRate.toFixed(1)}%`}
                    icon={Hotel}
                    color="orange"
                  />
                  <StatCard
                    title="Total Guests"
                    value={stats.totalGuests}
                    icon={Users}
                    color="indigo"
                  />
                  <StatCard
                    title="Average Room Price"
                    value={`$${stats.averageRoomPrice.toFixed(2)}`}
                    icon={DollarSign}
                    color="green"
                  />
                  <StatCard
                    title="Total Revenue"
                    value={`$${stats.totalRevenue.toLocaleString()}`}
                    icon={TrendingUp}
                    color="emerald"
                  />
                  <StatCard
                    title="Occupied Rooms"
                    value={stats.occupiedRooms}
                    icon={UserCheck}
                    color="red"
                  />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  {/* Reservation Status Distribution */}
                  <PieChart 
                    data={reservationStatusData} 
                    title="Reservation Status Distribution" 
                  />
                  
                  {/* Monthly Reservations */}
                  <SimpleBarChart 
                    data={monthlyReservations} 
                    title="Monthly Reservations (Last 6 Months)" 
                  />
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
