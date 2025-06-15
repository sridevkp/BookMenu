import React from 'react';
import Bookmark from '../../components/Bookmark';

const FolderContainer = ({
  folderId,
  folder,
  selecting,
  select,
  deselect,
  onDragStart,
  onDragOver,
  onDrop
}) => (
  <div
    className="container blueglass folder-container"
    onDragOver={onDragOver}
    onDrop={() => onDrop(folderId)}
  >
    <div className="folder-title">
      {folder.title || "Other Bookmarks"}
    </div>
    <div className="folder-bookmarks">
      {folder.bookmarks.map(
        (bookmark) => (
          <div
            key={bookmark.id}
            draggable
            onDragStart={() => onDragStart(bookmark)}
            style={{ cursor: "grab" }}
          >
            <Bookmark
              bookmark={bookmark}
              selecting={selecting}
              onToggleSelect={ e => e.target.checked ? select(bookmark) : deselect(bookmark) }
            />
          </div>
        )
      )}
    </div>
  </div>
);

export default FolderContainer;
