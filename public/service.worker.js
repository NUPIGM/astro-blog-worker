window.addEventListener("online", () => {
  console.log("online");
});
window.addEventListener("offline", () => {
  console.log("offline");
});
// 1. 注册 Service Worker
// Don't register the service worker
// until the page has fully loaded
window.addEventListener("load", () => {
  // Is service worker available?
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("sw.js")
      .then((reg) => {
        console.log("Service worker registered!");
        //reg.installing; // the installing worker, or undefined
        //reg.waiting; // the waiting worker, or undefined
        //reg.active; // the active worker, or undefined
        reg.addEventListener("updatefound", () => {
          // A wild service worker has appeared in reg.installing!
          const newWorker = reg.installing;
          console.log("Service worker has updated");
          // "installing" - the install event has fired, but not yet complete
          // "installed"  - install complete
          // "activating" - the activate event has fired, but not yet complete
          // "activated"  - fully active
          // "redundant"  - discarded. Either failed install, or it's been
          //                replaced by a newer version
          newWorker.addEventListener("statechange", () => {
            // newWorker.state has changed
          });
        });
      })
      .catch((error) => {
        console.warn("Error registering service worker:");
        console.warn(error);
      });
  }
});
