import React from 'react';
import Bookmark from '../../components/Bookmark';

const SearchResults = ({ bookmarks, results, selecting, select, deselect }) => (
  <div className="container blueglass">
    <div id="bookmarks">
      { bookmarks 
        ? results.length 
          ? results.map(
              ({item:bookmark}) => (
                <div
                  key={bookmark.id}
                  draggable
                  style={{ cursor: "grab" }}
                >
                  <Bookmark
                    bookmark={bookmark}
                    selecting={selecting}
                    onToggleSelect={ e => e.target.checked ? select(bookmark) : deselect(bookmark) }
                  />
                </div>
              )
            )
          : <div className="title">No Results</div>
        : <div className="title">No Bookmarks</div> 
      }
    </div>
  </div>
);

export default SearchResults;
