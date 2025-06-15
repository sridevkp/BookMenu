import React, { useEffect, useRef, useState, useCallback } from 'react';
import Fuse from 'fuse.js'

import ConfirmDialog from '../../components/ConfirmDialog';
import SearchResults from '../../components/SearchResults';

import ToggleButton from '@mui/material/ToggleButton';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';

import ChecklistIcon from '@mui/icons-material/Checklist';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuIcon from '@mui/icons-material/Menu';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';

import './background.css';
import './newtab.css';
import FolderContainer from '../../components/FolderContainer';
import PromptDialog from '../../components/PromptDialog';

const Newtab = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState('');
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [openMenu, setOpenMenu] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [folders, setFolders] = useState({});

  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const anchorRef = useRef();
  const fuseRef = useRef();

  // Track drag state
  const [draggedBookmark, setDraggedBookmark] = useState(null);

  // Helper to build folders from bookmark tree
  const addBookmarks = useCallback((bookmarkNodes, parentTitle = "Other Bookmarks", parentId = "root", foldersAcc = {}) => {
    for (let bookmark of bookmarkNodes) {
      if (bookmark.children) {
        addBookmarks(bookmark.children, bookmark.title || parentTitle, bookmark.id, foldersAcc);
      } else if (bookmark.url) {
        const folderKey = parentId;
        const folderTitle = parentTitle;
        if (!foldersAcc[folderKey]) {
          foldersAcc[folderKey] = { title: folderTitle, bookmarks: [] };
        }
        foldersAcc[folderKey].bookmarks.push(bookmark);
      }
    }
    return foldersAcc;
  }, []);

  // Load bookmarks tree on mount
  useEffect(() => {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      setFolders(addBookmarks(bookmarkTreeNodes));
    });
  }, [addBookmarks]);

  // Flatten bookmarks for search
  useEffect(() => {
    setBookmarks(Object.values(folders).flatMap(f => f.bookmarks));
  }, [folders]);

  // Update fuse instance when bookmarks change
  useEffect(() => {
    fuseRef.current = new Fuse(bookmarks, {
      shouldSort: true,
      includeScore: true,
      threshold: 0.4,
      keys: ['url', 'title'],
    });
  }, [bookmarks]);

  // Selection handlers
  const select = useCallback(bookmark => setSelected(prev => new Set(prev).add(bookmark)), []);
  const deselect = useCallback(bookmark => setSelected(prev => {
    const next = new Set(prev);
    next.delete(bookmark);
    return next;
  }), []);

  // Menu/confirm handlers
  const handleCloseMenu = () => setOpenMenu(false);
  const handleCloseConfirm = () => setOpenConfirm(false);

  // Search handler
  const handleInput = useCallback((searchTerm) => {
    searchTerm = searchTerm.toLowerCase().trim();
    if (searchTerm) {
      setSearching(searchTerm);
      setResults(fuseRef.current.search(searchTerm));
    } else {
      setSearching('');
      setResults([]);
    }
  }, []);

  // Delete handler
  const handleDelete = () => selected.size ? setOpenConfirm(true) : setOpenMenu(false);

  // Delete bookmarks and update state
  const deleteBookmarks = async () => {
    setOpenConfirm(false);
    const idsToDelete = Array.from(selected).map(bookmark => bookmark.id);
    await Promise.all(
      idsToDelete.map(id => new Promise(resolve => chrome.bookmarks.remove(id, resolve)))
    );
    setFolders(prevFolders => {
      const newFolders = { ...prevFolders };
      Object.keys(newFolders).forEach(folderId => {
        newFolders[folderId].bookmarks = newFolders[folderId].bookmarks.filter(
          bookmark => !idsToDelete.includes(bookmark.id)
        );
        if (newFolders[folderId].bookmarks.length === 0) {
          delete newFolders[folderId];
        }
      });
      return newFolders;
    });
    setBookmarks(prevNodes => prevNodes.filter(node => !idsToDelete.includes(node.id)));
    setSelected(new Set());
    setOpenMenu(false);

    // Update search results immediately after deletion
    if (searching) {
      setResults(prevResults =>
        prevResults.filter(({ item }) => !idsToDelete.includes(item.id))
      );
    }
  };

  // Handle drag start on a bookmark
  const handleDragStart = (bookmark) => {
    setDraggedBookmark(bookmark);
  };

  // Handle drag over on a folder container
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle drop on a folder container
  const handleDrop = async (folderId) => {
    if (!draggedBookmark || !folderId) return;
    // Move the bookmark in Chrome
    await new Promise(resolve =>
      chrome.bookmarks.move(draggedBookmark.id, { parentId: folderId }, resolve)
    );
    // Remove from old folder and add to new folder in state
    setFolders(prevFolders => {
      const newFolders = { ...prevFolders };
      // Remove from all folders
      Object.keys(newFolders).forEach(fid => {
        newFolders[fid].bookmarks = newFolders[fid].bookmarks.filter(
          b => b.id !== draggedBookmark.id
        );
        if (newFolders[fid].bookmarks.length === 0) {
          delete newFolders[fid];
        }
      });
      // Add to new folder
      if (!newFolders[folderId]) {
        newFolders[folderId] = { title: (draggedBookmark.parentTitle || "Other Bookmarks"), bookmarks: [] };
      }
      // Update parentId for the bookmark
      const updatedBookmark = { ...draggedBookmark, parentId: folderId };
      newFolders[folderId].bookmarks = [...(newFolders[folderId].bookmarks || []), updatedBookmark];
      return newFolders;
    });
    setDraggedBookmark(null);
  };

  const handleCreateFolder = () => {
    setCreatingFolder(true);
    setOpenMenu(false);
    setNewFolderName('');
  };

  const handleCreateFolderSubmit = () => {
    if (!newFolderName.trim()) return;
    // Create the new folder under Bookmarks Bar (id: "1")
    chrome.bookmarks.create({ parentId: "1", title: newFolderName.trim() }, async (newFolder) => {
      // If bookmarks are selected, move them to the new folder
      if (selected.size > 0 && newFolder && newFolder.id) {
        await Promise.all(
          Array.from(selected).map(b =>
            new Promise(resolve =>
              chrome.bookmarks.move(b.id, { parentId: newFolder.id }, resolve)
            )
          )
        );
        setSelected(new Set());
      }
      setCreatingFolder(false);
      setNewFolderName('');
      // Refresh folders
      chrome.bookmarks.getTree((bookmarkTreeNodes) => {
        setFolders(addBookmarks(bookmarkTreeNodes));
      });
    });
    
  };

  return (
    <>
      <div className='fscreen'></div>

      <header>
        <nav>
          <div className="img-logo">
            <img src="/icons/icon128.png" width="32" height="32" alt="logo" />
          </div>
          <div className="search">
            <div className="search-box">
              <Button className="btn" onClick={() => document.getElementById('search').focus()}>
                <SearchIcon width={24} height={24}/>
              </Button>
              <input
                autoFocus
                type="text"
                className="input-search"
                id="search"
                placeholder="Type to Search..."
                value={searching}
                onInput={e => handleInput(e.target.value)}
              />
            </div>
          </div>
          <div className='menu-icon' ref={anchorRef}>
            <Button onClick={() => setOpenMenu(!openMenu)}>
              <MenuIcon width={24} height={24}/>
            </Button>
            <Menu
              anchorEl={anchorRef.current}
              open={openMenu}
              onClose={handleCloseMenu}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              sx={{marginTop:1,minWidth:180}}
            >
              <MenuItem
                onClick={handleCreateFolder}
                sx={{padding:1,minWidth:180}}
              >
                <CreateNewFolderIcon/>
                <Typography sx={{ml:2}} variant="inherit">New Folder</Typography>
              </MenuItem>
              <MenuItem
                onClick={handleDelete}
                sx={{padding:1,minWidth:180}}
                disabled={selected.size === 0}
              >
                <DeleteIcon/> 
                <Typography sx={{ml:2}} variant="inherit">Delete {`  (${selected.size})`}</Typography>
              </MenuItem>
            </Menu>
          </div>
          <div className='menu-icon'>
            <ToggleButton value="check"
              selected={selecting}
              onChange={() => {
                setSelecting(!selecting);
                setSelected(new Set());
              }}>
              <ChecklistIcon width={24} height={24}/>
            </ToggleButton>
          </div>
        </nav>
      </header>

      <main>
        <div className="title">{searching ? "Search results" : "All Bookmarks"}</div>
        {searching ? (
          <SearchResults
            bookmarks={bookmarks.length}
            results={results}
            selecting={selecting}
            select={select}
            deselect={deselect}
          />
        ) : (
          <div className="masonry-folders">
            {Object.entries(folders).map(([folderId, folder]) =>
                <FolderContainer
                  key={folderId}
                  folderId={folderId}
                  folder={folder}
                  selecting={selecting}
                  select={select}
                  deselect={deselect}
                  draggedBookmark={draggedBookmark}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
            )}
          </div>
        )}
      </main>

      <ConfirmDialog 
        open={openConfirm} 
        onClose={handleCloseConfirm} 
        onConfirmed={deleteBookmarks} 
        size={selected.size}
      />

      <PromptDialog
        open={creatingFolder}
        onClose={() => setCreatingFolder(false)}
        title="Create New Folder"
        onConfirm={handleCreateFolderSubmit}
        onCancel={() => setCreatingFolder(false)}
        value={newFolderName}
        onChange={val => setNewFolderName(val)}
      />
    </>
  );
};

export default Newtab;

