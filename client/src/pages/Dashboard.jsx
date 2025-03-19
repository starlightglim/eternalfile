import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchBoards, fetchPublicBoards } from '../store/slices/boardsSlice';
import { fetchFolders } from '../store/slices/foldersSlice';
import { openModal } from '../store/slices/uiSlice';

// Components
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorMessage from '../components/ui/ErrorMessage';
import BoardCard from '../components/boards/BoardCard';
import FolderCard from '../components/folders/FolderCard';

// Icons
import { 
  Plus, 
  FolderPlus, 
  LayoutGrid, 
  Users, 
  Star,
  Search
} from 'lucide-react';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get view from URL params (default to 'boards')
  const currentView = searchParams.get('view') || 'boards';
  
  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Redux state
  const { boards, publicBoards, loading: boardsLoading, error: boardsError } = useSelector(state => state.boards);
  const { folders, loading: foldersLoading, error: foldersError } = useSelector(state => state.folders);
  
  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchBoards());
    dispatch(fetchFolders());
    
    if (currentView === 'public') {
      dispatch(fetchPublicBoards({ page: 1, limit: 20 }));
    }
  }, [dispatch, currentView]);
  
  // Handle creating a new board
  const handleCreateBoard = () => {
    dispatch(openModal({ modal: 'createBoard' }));
  };
  
  // Handle creating a new folder
  const handleCreateFolder = () => {
    dispatch(openModal({ modal: 'createFolder' }));
  };
  
  // Filter boards and folders based on search term
  const filteredBoards = boards.filter(board => 
    board.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredPublicBoards = publicBoards.filter(board => 
    board.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Loading state
  if (boardsLoading || foldersLoading) {
    return <LoadingSpinner />;
  }
  
  // Error state
  if (boardsError || foldersError) {
    return <ErrorMessage message={boardsError || foldersError} />;
  }
  
  return (
    <div className="h-full">
      {/* Dashboard header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">
            {currentView === 'boards' && 'My Boards'}
            {currentView === 'public' && 'Public Feed'}
            {currentView === 'favorites' && 'Favorites'}
          </h1>
          <p className="text-gray-500 mt-1">
            {currentView === 'boards' && 'Manage your personal image boards'}
            {currentView === 'public' && 'Discover public boards from the community'}
            {currentView === 'favorites' && 'Your favorite boards and images'}
          </p>
        </div>
        
        <div className="flex space-x-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          {/* Create buttons (only show in 'boards' view) */}
          {currentView === 'boards' && (
            <>
              <button
                onClick={handleCreateBoard}
                className="flex items-center bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 py-2"
              >
                <Plus size={18} className="mr-2" />
                New Board
              </button>
              <button
                onClick={handleCreateFolder}
                className="flex items-center bg-gray-200 hover:bg-gray-300 rounded-md px-4 py-2"
              >
                <FolderPlus size={18} className="mr-2" />
                New Folder
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* View tabs */}
      <div className="flex border-b border-gray-300 mb-6">
        <button
          onClick={() => navigate('/dashboard?view=boards')}
          className={`flex items-center px-4 py-2 border-b-2 ${
            currentView === 'boards' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent hover:border-gray-300'
          }`}
        >
          <LayoutGrid size={18} className="mr-2" />
          My Boards
        </button>
        <button
          onClick={() => navigate('/dashboard?view=public')}
          className={`flex items-center px-4 py-2 border-b-2 ${
            currentView === 'public' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent hover:border-gray-300'
          }`}
        >
          <Users size={18} className="mr-2" />
          Public Feed
        </button>
        <button
          onClick={() => navigate('/dashboard?view=favorites')}
          className={`flex items-center px-4 py-2 border-b-2 ${
            currentView === 'favorites' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent hover:border-gray-300'
          }`}
        >
          <Star size={18} className="mr-2" />
          Favorites
        </button>
      </div>
      
      {/* Content based on current view */}
      {currentView === 'boards' && (
        <div>
          {/* Folders section */}
          {filteredFolders.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold mb-4">Folders</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredFolders.map(folder => (
                  <FolderCard key={folder._id} folder={folder} />
                ))}
              </div>
            </div>
          )}
          
          {/* Boards section */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Boards</h2>
            {filteredBoards.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredBoards.map(board => (
                  <BoardCard key={board._id} board={board} />
                ))}
              </div>
            ) : (
              <div className="bg-gray-100 rounded-md p-8 text-center">
                <p className="text-gray-500 mb-4">You don't have any boards yet</p>
                <button
                  onClick={handleCreateBoard}
                  className="bg-blue-500 hover:bg-blue-600 text-white rounded-md px-4 py-2"
                >
                  Create Your First Board
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {currentView === 'public' && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Public Boards</h2>
          {filteredPublicBoards.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredPublicBoards.map(board => (
                <BoardCard key={board._id} board={board} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-100 rounded-md p-8 text-center">
              <p className="text-gray-500">No public boards found</p>
            </div>
          )}
        </div>
      )}
      
      {currentView === 'favorites' && (
        <div className="bg-gray-100 rounded-md p-8 text-center">
          <p className="text-gray-500">Favorites feature coming soon</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 