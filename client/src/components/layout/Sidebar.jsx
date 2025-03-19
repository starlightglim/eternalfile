import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBoards } from '../../store/slices/boardsSlice';
import { fetchFolders } from '../../store/slices/foldersSlice';
import { openModal } from '../../store/slices/uiSlice';

// Icons
import { 
  FolderPlus, 
  Plus, 
  Folder, 
  LayoutGrid,
  Users,
  Star,
  Settings
} from 'lucide-react';

const Sidebar = () => {
  const dispatch = useDispatch();
  const { boards } = useSelector(state => state.boards);
  const { folders } = useSelector(state => state.folders);
  
  // Fetch boards and folders on component mount
  useEffect(() => {
    dispatch(fetchBoards());
    dispatch(fetchFolders());
  }, [dispatch]);
  
  const handleCreateBoard = () => {
    dispatch(openModal({ modal: 'createBoard' }));
  };
  
  const handleCreateFolder = () => {
    dispatch(openModal({ modal: 'createFolder' }));
  };
  
  return (
    <div className="h-full flex flex-col p-2 overflow-y-auto">
      {/* Actions */}
      <div className="flex justify-between mb-4">
        <button 
          onClick={handleCreateBoard}
          className="flex items-center bg-blue-500 hover:bg-blue-600 text-white rounded px-3 py-1 text-sm"
        >
          <Plus size={16} className="mr-1" /> Board
        </button>
        <button 
          onClick={handleCreateFolder}
          className="flex items-center bg-gray-300 hover:bg-gray-400 rounded px-3 py-1 text-sm"
        >
          <FolderPlus size={16} className="mr-1" /> Folder
        </button>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1">
        <ul className="space-y-1">
          {/* Dashboard */}
          <li>
            <Link 
              to="/dashboard" 
              className="flex items-center p-2 rounded hover:bg-gray-300 text-sm"
            >
              <LayoutGrid size={16} className="mr-2" />
              Dashboard
            </Link>
          </li>
          
          {/* Recent Boards */}
          <li className="mt-4">
            <div className="flex items-center justify-between p-2">
              <span className="text-xs font-bold uppercase text-gray-500">Recent Boards</span>
            </div>
            <ul className="ml-2 space-y-1">
              {boards.slice(0, 5).map(board => (
                <li key={board._id}>
                  <Link 
                    to={`/boards/${board._id}`} 
                    className="flex items-center p-2 rounded hover:bg-gray-300 text-sm truncate"
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                    {board.title}
                  </Link>
                </li>
              ))}
              {boards.length === 0 && (
                <li className="text-xs text-gray-500 p-2">No boards yet</li>
              )}
            </ul>
          </li>
          
          {/* Folders */}
          <li className="mt-4">
            <div className="flex items-center justify-between p-2">
              <span className="text-xs font-bold uppercase text-gray-500">Folders</span>
            </div>
            <ul className="ml-2 space-y-1">
              {folders.filter(folder => !folder.parentId).map(folder => (
                <li key={folder._id}>
                  <Link 
                    to={`/folders/${folder._id}`} 
                    className="flex items-center p-2 rounded hover:bg-gray-300 text-sm"
                  >
                    <Folder size={16} className="mr-2" />
                    {folder.name}
                    {folder.isDefault && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1 rounded">Default</span>
                    )}
                  </Link>
                </li>
              ))}
              {folders.length === 0 && (
                <li className="text-xs text-gray-500 p-2">No folders yet</li>
              )}
            </ul>
          </li>
          
          {/* Public Feed */}
          <li className="mt-4">
            <Link 
              to="/dashboard?view=public" 
              className="flex items-center p-2 rounded hover:bg-gray-300 text-sm"
            >
              <Users size={16} className="mr-2" />
              Public Feed
            </Link>
          </li>
          
          {/* Favorites */}
          <li>
            <Link 
              to="/dashboard?view=favorites" 
              className="flex items-center p-2 rounded hover:bg-gray-300 text-sm"
            >
              <Star size={16} className="mr-2" />
              Favorites
            </Link>
          </li>
        </ul>
      </nav>
      
      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-gray-300">
        <Link 
          to="/settings" 
          className="flex items-center p-2 rounded hover:bg-gray-300 text-sm"
        >
          <Settings size={16} className="mr-2" />
          Settings
        </Link>
      </div>
    </div>
  );
};

export default Sidebar; 