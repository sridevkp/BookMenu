import React, { useEffect, useReducer, useRef, useState } from 'react';
import Bookmark from '../../components/Bookmark';

import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import ToggleButton from '@mui/material/ToggleButton';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Menu from '@mui/material/Menu';

import ChecklistIcon from '@mui/icons-material/Checklist';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuIcon from '@mui/icons-material/Menu';



import './background.css';
import './newtab.css';

const Newtab = () => {
    const [nodes, setNodes] = useState(new Set());
    const [results, setResuts] = useState(new Set());
    const [searching, setSearching] = useState(false);
    const [selecting, setSelecting] = useState(false);
    const [selected, setSelected] = useState(new Set());
    const [openMenu, setOpenMenu] = useState();
    const [openConfirm, setOpenConfirm] = useState();

    const anchorRef = useRef();

    useEffect( () => {
      const nav = document.querySelector('nav');
      navigator.brave && nav.classList.add('brave-nav');
      
    

      chrome.bookmarks.getTree((bookmarkTreeNodes) => {
        if (bookmarkTreeNodes.length) {
          addBookmarks( bookmarkTreeNodes );
        }
      });

      function addBookmarks(bookmarkNodes) {
        for (let node of bookmarkNodes) {
          if (node.children) {
            addBookmarks(node.children);
          } else if (node.url) {
            pushNode( node )
          }
        }
      }
    }, [])

    const select = node => setSelected( prev => prev.add(node) );
    
    const deselect = node => setSelected( prev => { prev.delete(node); return prev } );
    
    const pushNode = node => setNodes(nodes => new Set(nodes).add(node));

    const handleCloseMenu = () => setOpenMenu(false);

    const handleCloseConfirm = () => setOpenConfirm(false);

    const createElements = node => <Bookmark node={node} selecting={selecting} onToggleSelect={ e => e.target.checked ? select(node) : deselect(node) } />

    const handleInput = searchTerm => {
      searchTerm = searchTerm.toLowerCase().trim();
      setSearching(searchTerm);
      setResuts(new Set(Array.from(nodes).filter(node => node.url.toLowerCase().includes(searchTerm) || node.title.toLowerCase().includes(searchTerm))));
}
  
    const handleDelete = () => selected.size ? setOpenConfirm(true) : setOpenMenu(false) ;

    const deleteBookmarks = async () => {
      setOpenConfirm(false);

      selected.forEach( node => {
        console.log(node.id);
        chrome.bookmarks.remove(node.id, function() {
          setNodes( prev => {
            prev.delete(node)
            return new Set(prev);
          })
        });
      });
      setSelected( new Set() );
    };
    
  return (
    <>
      <div class="background">
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
        <nav>

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
            { nodes.size 
              ? searching 
                ? results.size 
                  ?Array.from(results).map( createElements )
                  :<div className="title">No Results</div>
                : Array.from(nodes).map( createElements )
              :<div className="title">No Bookmarks</div> 
            }
          </div>
        </div>
      </main>

      <Dialog
        open={openConfirm}
        onClose={handleCloseConfirm}
        aria-labelledby="responsive-dialog-title"
      >
        <DialogTitle id="responsive-dialog-title">
          {"Confirm"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`Delete ${selected.size} bookmarks`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button autoFocus onClick={handleCloseConfirm}>
            Cancel
          </Button>
          <Button onClick={deleteBookmarks} autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Newtab;
