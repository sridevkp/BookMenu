import React, { useEffect } from 'react';
import Checkbox from '@mui/material/Checkbox';
import './bookmark.css';

const Bookmark = ({ node, selecting, onToggleSelect }) => {
    const faviconURL = u => {
        const url = new URL(chrome.runtime.getURL("/_favicon/"));
        url.searchParams.set("pageUrl", u);
        url.searchParams.set("size", "256");
        return url.toString();
    }
    
  return (
    <a href={node.url} className="bookmark" title={node.title} key={node.title}>
        <div className="more">
          {selecting &&
            <Checkbox onChange={onToggleSelect} size="small" sx={{ padding:0 }}/>
          }
        </div>
        <img src={faviconURL( node.url )} alt={node.title} />
        <span className='bookmark-title'>{ node.title }</span>
    </a>
  )
}

export default Bookmark