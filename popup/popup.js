document.addEventListener('DOMContentLoaded', function () {
    // Get the container element where bookmarks will be displayed
    const bookmarksContainer = document.getElementById('bookmarks-container');

    // Fetch all bookmarks
    chrome.bookmarks.getTree(function (bookmarkTreeNodes) {
        displayBookmarks(bookmarkTreeNodes, bookmarksContainer);
    });
});

// Function to display bookmarks recursively
function displayBookmarks(bookmarkNodes, parentElement) {
    for (const node of bookmarkNodes) {
        if (node.children) {
            // Create a folder element
            const folderElement = document.createElement('div');
            folderElement.className = 'bookmark-folder';
            folderElement.textContent = node.title;
            parentElement.appendChild(folderElement);

            // Recursively display children
            const childContainer = document.createElement('div');
            childContainer.className = 'bookmark-children';
            parentElement.appendChild(childContainer);
            displayBookmarks(node.children, childContainer);
        } else {
            // Create a bookmark link element
            const bookmarkElement = document.createElement('a');
            bookmarkElement.className = 'bookmark-link';
            bookmarkElement.href = node.url;
            bookmarkElement.target = '_blank';

            // Create an icon for the bookmark
            const iconElement = document.createElement('img');
            iconElement.className = 'bookmark-icon';
            iconElement.src = `https://s2.googleusercontent.com/s2/favicons?domain=${node.url}`;
            bookmarkElement.appendChild(iconElement);

            // Add the bookmark title
            const titleElement = document.createTextNode(node.title);
            bookmarkElement.appendChild(titleElement);

            parentElement.appendChild(bookmarkElement);
        }
    }
}

//remove bm
//change folders
//sync
//side view topwview
//auto cleanup
//ai analyzer site time monitor
//security notes