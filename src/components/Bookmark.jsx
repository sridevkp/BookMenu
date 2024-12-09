import React, { useState } from 'react';

import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';

import './bookmark.css';

const Bookmark = ({ bookmark, selecting, onToggleSelect }) => {
    const [preview, setPreview] = useState(null);
    const [open, setOpen] = useState(false);

    const faviconURL = u => {
        const url = new URL(chrome.runtime.getURL("/_favicon/"));
        url.searchParams.set("pageUrl", u);
        url.searchParams.set("size", "256");
        return url.toString();
    }

    async function fetchSitePreview(url) {
      try {
          const response = await fetch(url);
          const html = await response.text();
  
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
  
          const ogTitle = doc.querySelector('meta[property="og:title"]')?.content || bookmark.title;
          const ogDescription = doc.querySelector('meta[property="og:description"]')?.content || bookmark.url;
          const ogImage = doc.querySelector('meta[property="og:image"]')?.content || '';
  
          setPreview({
              title: ogTitle,
              description: ogDescription,
              image: ogImage
          });
      } catch (error) {
          console.error('Error fetching site preview:');
      }
  }

  const handleTooltipOpen = () => {
    if( preview == null ){
      fetchSitePreview(bookmark.url);
    }
    setOpen(true);
  }
    
  return (
    <a href={bookmark.url} className="bookmark" key={bookmark.title}>
      <div className="more">
        {selecting &&
          <Checkbox onChange={onToggleSelect} size="small" sx={{ padding:0 }}/>
        }
      </div>
      <img src={faviconURL( bookmark.url )} alt={bookmark.title}/>
      <Tooltip
        arrow
        disableInteractive
        open={open}
        onOpen={handleTooltipOpen }
        onClose={ () => setOpen(false)}
        disableHoverListener={false}
        disableFocusListener={false}
        disableTouchListener={false}
        title={
          <>
            <Typography color="inherit" >{preview ? preview.title :  bookmark.title }</Typography>
            <p>{preview && preview.description }</p> 
          </>
        }
      >
        <span className='bookmark-title'>{ bookmark.title }</span>
      </Tooltip>
    </a>
  )
}

export default Bookmark