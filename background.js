// Clicking the toolbar icon injects the selection overlay into the current tab.
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["lib/jsQR.js", "content.js"],
    });
  } catch (err) {
    // chrome://, the Web Store and similar pages don't allow script injection.
    console.warn("QR Reader: cannot run on this page.", err);
  }
});

// The content script asks for a screenshot of the visible tab once a rectangle is drawn.
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type !== "qr-capture") return;
  chrome.tabs
    .captureVisibleTab(sender.tab.windowId, { format: "png" })
    .then((dataUrl) => sendResponse({ dataUrl }))
    .catch((err) => sendResponse({ error: err.message }));
  return true; // keep the channel open for the async response
});
