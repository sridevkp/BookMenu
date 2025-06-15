import React from 'react';

const DraggableBookmark = ({ bookmark, onDragStart, children }) => (
  <div
    draggable
    onDragStart={() => onDragStart(bookmark)}
    style={{ cursor: "grab" }}
  >
    {children}
  </div>
);

export default DraggableBookmark;
