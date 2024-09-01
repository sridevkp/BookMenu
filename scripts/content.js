console.log("content script loaded");

document.querySelectorAll("article").forEach( article => {
    const length = article.textContent.length;
    const p = document.createElement("p");
    p.textContent = length
    article.insertAdjacentElement( p )
})