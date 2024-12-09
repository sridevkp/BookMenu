import React, { useEffect, useReducer, useRef, useState } from 'react';
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
    const [bookmarks, setNodes] = useState([]);
    const [results, setResults] = useState([]);
    const [searching, setSearching] = useState(null);
    const [selecting, setSelecting] = useState(false);
    const [selected, setSelected] = useState(new Set());
    const [openMenu, setOpenMenu] = useState(false);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [browserClass, setBrowserClass] = useState('');

    const anchorRef = useRef();
    const fuseRef = useRef();

    useEffect(() => {
      const detectBrowser = async () => {
        if (navigator.brave && (await navigator.brave.isBrave())) {
            setBrowserClass('brave-nav');
        }
      };

      chrome.bookmarks.getTree(
        (bookmarkTreeNodes) => addBookmarks(bookmarkTreeNodes)
      );
      

      function addBookmarks(bookmarkNodes) {
        for (let bookmark of bookmarkNodes) {
          if (bookmark.children) {
            addBookmarks(bookmark.children);
          } else if (bookmark.url) {
            pushNode( bookmark )
          }
        }
      }

      detectBrowser();
    }, [])

    useEffect(() => {
      fuseRef.current = new Fuse(bookmarks, {
        shouldSort: true,
        includeScore: true,
        threshold: 0.4,
        keys: [
          'url', 
          'title',
        ]
      })
    },[bookmarks])

    useEffect(() => {
      if (searching) {
        const result = fuseRef.current.search(searching);
        setResults(result);
      } else {
        setResults([]);
      }
    }, [searching]);
    

    const select = bookmark => setSelected( prev => prev.add(bookmark) );
    
    const deselect = bookmark => setSelected( prev => { prev.delete(bookmark); return prev } );
    
    const pushNode = bookmark => setNodes(bookmarks => [ ...bookmarks, bookmark]);

    const handleCloseMenu = () => setOpenMenu(false);

    const handleCloseConfirm = () => setOpenConfirm(false);

    const handleInput = searchTerm => {
      searchTerm = searchTerm.toLowerCase().trim();
      setSearching(searchTerm);
    }
  
    const handleDelete = () => selected.size ? setOpenConfirm(true) : setOpenMenu(false) ;

    const deleteBookmarks = async () => {
      setOpenConfirm(false);
      let filteredNodes = nodes
      selected.forEach( bookmark => {
        console.log(bookmark.id);

        chrome.bookmarks.remove(bookmark.id, function() {
          filteredNodes = filteredNodes.filter((b) => b.id !== bookmark.id);
        });
      });
      
      setNodes([...filteredNodes])
      setSearching(searching);
      setSelected( new Set() );
      setOpenMenu(false)
    };
    
  return (
    <>
      <div className="background">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <header>
        <nav className={browserClass}>
          <div className="img-logo">
            <img src="/icons/icon128.png" width="32" height="32" alt="logo" />
          </div>

          <div className="search">
            <div className="search-box">
              <Button className="btn">
                <SearchIcon width={24} height={24}/>
              </Button>
              <input type="text" className="input-search" id="search" placeholder="Type to Search..." onInput={ e => handleInput(e.target.value)}/>
            </div>
          </div>

          <div className='menu-icon'  ref={anchorRef}>
            <Button onClick={ () => setOpenMenu(!openMenu)}>
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
              }}>
              <ChecklistIcon width={24} height={24}/>
            </ToggleButton>
          </div>
        </nav>
      </header>

      <main className='img-bg'>
        <div className="title">{searching?"Search results":"All Bookmarks"}</div>
        
        <div className="container blueglass">
          <div id="bookmarks">
            { bookmarks.length 
              ? searching 
                ? results.length 
                  ? results.map(
                    ({item:bookmark}, idx) => <Bookmark key={idx} bookmark={bookmark} selecting={selecting} onToggleSelect={ e => e.target.checked ? select(bookmark) : deselect(bookmark) } />
                  )
                  :<div className="title">No Results</div>
                : bookmarks.map(
                    (bookmark, idx) => <Bookmark key={idx} bookmark={bookmark} selecting={selecting} onToggleSelect={ e => e.target.checked ? select(bookmark) : deselect(bookmark) } />
                  )
              :<div className="title">No Bookmarks</div> 
            }
          </div>
        </div>
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
