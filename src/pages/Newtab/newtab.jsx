import React, { useEffect, useRef, useState, useCallback } from 'react';
import Fuse from 'fuse.js'

import ConfirmDialog from '../../components/ConfirmDialog';
import Bookmark from '../../components/Bookmark';

import ToggleButton from '@mui/material/ToggleButton';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';

import ChecklistIcon from '@mui/icons-material/Checklist';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuIcon from '@mui/icons-material/Menu';

import './background.css';
import './newtab.css';

const Newtab = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState('');
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [openMenu, setOpenMenu] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [folders, setFolders] = useState({});

  const anchorRef = useRef();
  const fuseRef = useRef();

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
              <MenuItem onClick={handleDelete} sx={{padding:1,minWidth:180}}>
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
          <div className="container blueglass">
            <div id="bookmarks">
              { bookmarks.length 
                ? results.length 
                  ? results.map(
                      ({item:bookmark}) => <Bookmark key={bookmark.id} bookmark={bookmark} selecting={selecting} onToggleSelect={ e => e.target.checked ? select(bookmark) : deselect(bookmark) } />
                    )
                  : <div className="title">No Results</div>
                : <div className="title">No Bookmarks</div> 
              }
            </div>
          </div>
        ) : (
          <div className="masonry-folders">
            {Object.entries(folders).map(([folderId, folder]) =>
              folder.bookmarks.length ? (
                <div
                  key={folderId}
                  className="container blueglass folder-container"
                >
                  <div className="folder-title">
                    {folder.title || "Other Bookmarks"}
                  </div>
                  <div className="folder-bookmarks">
                    {folder.bookmarks.map(
                      (bookmark) => <Bookmark key={bookmark.id} bookmark={bookmark} selecting={selecting} onToggleSelect={ e => e.target.checked ? select(bookmark) : deselect(bookmark) } />
                    )}
                  </div>
                </div>
              ) : null
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
    </>
  );
};

export default Newtab;
