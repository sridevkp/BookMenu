import React, { useState } from 'react';

import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';

import './bookmark.css';

const Bookmark = ({ node, selecting, onToggleSelect }) => {
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
  
          const ogTitle = doc.querySelector('meta[property="og:title"]')?.content || node.title;
          const ogDescription = doc.querySelector('meta[property="og:description"]')?.content || node.url;
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
      fetchSitePreview(node.url);
    }
    setOpen(true);
  }
    
  return (
    <a href={node.url} className="bookmark" key={node.title}>
      <div className="more">
        {selecting &&
          <Checkbox onChange={onToggleSelect} size="small" sx={{ padding:0 }}/>
        }
      </div>
      <img src={faviconURL( node.url )} alt={node.title} />
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
            <Typography color="inherit" >{preview ? preview.title :  node.title }</Typography>
            <p>{preview && preview.description }</p> 
          </>
        }
      >
        <span className='bookmark-title'>{ node.title }</span>
      </Tooltip>
    </a>
  )
}

export default Bookmark