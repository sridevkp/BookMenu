import React, { useEffect, useState } from 'react';
import './popup.css';

const Popup = () => {
    const [previewData,setPreviewData] = useState( {
        title: '',
        description: '',
        image: ''
      });

    useEffect(() => {
        const fetchSitePreview =  async url => {
            try {
                const response = await fetch(url);
                const html = await response.text();
        
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
        
                const ogTitle = doc.querySelector('meta[property="og:title"]')?.content || 'No Title';
                const ogDescription = doc.querySelector('meta[property="og:description"]')?.content || 'No Description';
                const ogImage = doc.querySelector('meta[property="og:image"]')?.content || 'No Image';
        
                return {
                    title: ogTitle,
                    description: ogDescription,
                    image: ogImage
                };
            } catch (error) {
                console.error('Error fetching site preview:', error);
                return null;
            }
        }

        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'fetch-preview') {
                fetchSitePreview(request.url).then(previewData => {
                    displayPreview(previewData);
                });
            }
        });
    },[])

    
    
  return (
    <>
        <div className="preview-content">
            <img src={previewData.image || `chrome://favicon/${previewData.title}`} alt={previewData.title} width={64} height={64}/>
            <h2 className="title">{previewData.title}</h2>
            <p className="discription">{previewData.description}</p>
        </div>
    </>
  )
}

export default Popup

//remove bm
//change folders
//sync
//side view topwview
//auto cleanup
//ai analyzer site time monitor
//security notes