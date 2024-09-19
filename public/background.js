// chrome.runtime.onInstalled.addListener(() => {
//     console.log("Installed")
//     chrome.contextMenus.create({
//         id: "show-preview",
//         title: "Show Site Preview",
//         contexts: ["link"]
//     });
// });

// chrome.contextMenus.onClicked.addListener((info, tab) => {
//     if (info.menuItemId === "show-preview") {
//         const url = info.linkUrl;
//         chrome.runtime.sendMessage({ action: 'fetch-preview', url  })
//     }
// });

