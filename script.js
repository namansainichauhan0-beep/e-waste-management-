    const loginSessionKey = "rewired-demo-session";
    const loginSessionNameKey = "rewired-demo-name";
    const notificationReadKey = "rewired-notifications-read";
    const feedbackEntriesKey = "rewired-feedback";
    const issueReportsKey = "rewired-public-issue-reports";
    const supportQueriesKey = "rewired-support-queries";
    const demoRequestIds = new Set(["EW-1044", "EW-1045", "EW-1046", "EW-1047", "EW-1048"]);
    const collectors = ["Madhav", "Janvi", "Vaibhav", "Luv", "Diksha", "Naman"];
    const statusOptions = ["Pending", "Assigned", "In progress", "Completed", "Cancelled"];
    const statusClass = { "Pending": "pending", "Assigned": "assigned", "In progress": "in-progress", "Completed": "completed", "Cancelled": "cancelled" };
    const historyIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
    let requests = loadRequests();
    let history = loadHistory();
    let readNotificationIds = loadStoredIdSet(notificationReadKey, "notifications");
    let feedbackEntries = loadFeedbackEntries();
    let issueReports = loadIssueReports();
    let supportQueries = loadSupportQueries();
    let selectedIssuePhoto = "";
    let isCompressingIssuePhoto = false;

    function offsetDate(offset) {
      const date = new Date();
      date.setDate(date.getDate() + offset);
      return localDateString(date);
    }
    function localDateString(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    function loadRequests() {
      try {
        const saved = localStorage.getItem("loopback-requests");
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        const cleaned = parsed.filter(request => !demoRequestIds.has(request.id));
        if (cleaned.length !== parsed.length) {
          localStorage.setItem("loopback-requests", JSON.stringify(cleaned));
        }
        return cleaned;
      } catch (error) {
        console.error("Could not load saved requests.", error);
        return [];
      }
    }
    function loadHistory() {
      try {
        const saved = localStorage.getItem("loopback-history");
        if (saved) {
          const parsed = JSON.parse(saved);
          const cleaned = parsed.filter(entry => !demoRequestIds.has(entry.requestId));
          if (cleaned.length !== parsed.length) {
            localStorage.setItem("loopback-history", JSON.stringify(cleaned));
          }
          return cleaned;
        }
      } catch (error) {
        console.error("Could not load saved collection history.", error);
      }
      return requests.map((request, index) => ({
        id: `${request.id}-created`, requestId: request.id, name: request.name,
        message: "Collection request created", time: new Date(Date.now() - index * 3600000).toISOString()
      }));
    }
    function loadStoredIdSet(key, description) {
      try {
        const saved = localStorage.getItem(key);
        const parsed = saved ? JSON.parse(saved) : [];
        if (!Array.isArray(parsed)) throw new TypeError(`Saved ${description} data must be an array.`);
        return new Set(parsed.filter(id => typeof id === "string"));
      } catch (error) {
        console.error(`Could not load saved ${description} data.`, error);
        return new Set();
      }
    }
    function loadFeedbackEntries() {
      try {
        const saved = localStorage.getItem(feedbackEntriesKey);
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) throw new TypeError("Saved feedback data must be an array.");
        return parsed.filter(entry => entry && typeof entry.id === "string" &&
          typeof entry.name === "string" && Number.isInteger(Number(entry.rating)) &&
          Number(entry.rating) >= 1 && Number(entry.rating) <= 5 &&
          typeof entry.topic === "string" && typeof entry.message === "string" &&
          typeof entry.time === "string");
      } catch (error) {
        console.error("Could not load saved feedback.", error);
        return [];
      }
    }
    function loadIssueReports() {
      try {
        const saved = localStorage.getItem(issueReportsKey);
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) throw new TypeError("Saved issue reports must be an array.");
        return parsed.filter(report => report && typeof report.id === "string" &&
          typeof report.location === "string" && typeof report.category === "string" &&
          typeof report.description === "string" && typeof report.time === "string" &&
          (report.photo === "" || (typeof report.photo === "string" &&
            report.photo.length <= 1000000 && report.photo.startsWith("data:image/jpeg;base64,"))));
      } catch (error) {
        console.error("Could not load saved issue reports.", error);
        return [];
      }
    }
    function loadSupportQueries() {
      try {
        const saved = localStorage.getItem(supportQueriesKey);
        if (!saved) return [];
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) throw new TypeError("Saved support queries must be an array.");
        return parsed.filter(query => query && typeof query.id === "string" &&
          typeof query.name === "string" && typeof query.email === "string" &&
          typeof query.phone === "string" && typeof query.topic === "string" &&
          typeof query.description === "string" && typeof query.time === "string");
      } catch (error) {
        console.error("Could not load saved support queries.", error);
        return [];
      }
    }
    function save() {
      try {
        localStorage.setItem("loopback-requests", JSON.stringify(requests));
        localStorage.setItem("loopback-history", JSON.stringify(history));
      } catch (error) {
        console.error("Could not save collection data.", error);
        showToast("Could not save changes in this browser.");
      }
    }
    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
      })[character]);
    }
    function formatDate(value, options = { month: "short", day: "numeric" }) {
      if (!value) return "Not scheduled";
      const [year, month, day] = value.split("-").map(Number);
      return new Date(year, month - 1, day).toLocaleDateString(undefined, options);
    }
    function initials(name) {
      return name.split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase();
    }
    function addHistory(request, message) {
      history.unshift({ id: `${Date.now()}-${Math.random()}`, requestId: request.id, name: request.name, message, time: new Date().toISOString() });
    }
    function statusBadge(status) {
      return `<span class="status ${statusClass[status] || "pending"}">${escapeHtml(status)}</span>`;
    }
    function requestRows(list, editable) {
      if (!list.length) return '<tr><td colspan="5"><div class="empty-state">No requests found. Create a request to get started.</div></td></tr>';
      return list.map(request => `<tr>
        <td><div class="request-id">${escapeHtml(request.id)}</div><div class="sub-cell">${escapeHtml(request.name)}</div></td>
        <td><div class="item-name">${escapeHtml(request.category)}</div><div class="sub-cell">${escapeHtml(request.quantity)} item${Number(request.quantity) === 1 ? "" : "s"}</div></td>
        <td><div>${escapeHtml(formatDate(request.date))}</div><div class="sub-cell">${escapeHtml(request.window || "")}</div></td>
        <td>${editable
          ? `<select class="filter-select collector-select" data-id="${escapeHtml(request.id)}" aria-label="Assign collector for ${escapeHtml(request.id)}"><option value="">Unassigned</option>${collectors.map(collector => `<option ${request.collector === collector ? "selected" : ""}>${escapeHtml(collector)}</option>`).join("")}</select>`
          : `<div>${request.collector ? escapeHtml(request.collector) : '<span class="sub-cell">Unassigned</span>'}</div>`}</td>
        <td>${editable
          ? `<select class="filter-select status-select" data-id="${escapeHtml(request.id)}" aria-label="Update status for ${escapeHtml(request.id)}">${statusOptions.map(status => `<option ${request.status === status ? "selected" : ""}>${escapeHtml(status)}</option>`).join("")}</select>`
          : statusBadge(request.status)}</td>
      </tr>`).join("");
    }
    function matchingRequests(search, filter) {
      const query = search.trim().toLowerCase();
      return requests.filter(request => {
        const matchesQuery = !query || [request.id, request.name, request.category, request.address, request.collector].join(" ").toLowerCase().includes(query);
        return matchesQuery && (filter === "all" || request.status === filter);
      }).sort((a, b) => Number(b.id.split("-")[1]) - Number(a.id.split("-")[1]));
    }
    function bindTableControls(container) {
      container.querySelectorAll(".status-select").forEach(select => select.addEventListener("change", event => {
        const request = requests.find(item => item.id === event.target.dataset.id);
        if (!request) return;
        const oldStatus = request.status;
        request.status = event.target.value;
        addHistory(request, `Status changed from ${oldStatus} to ${request.status}`);
        save(); render(); showToast(`${request.id} marked ${request.status.toLowerCase()}.`);
      }));
      container.querySelectorAll(".collector-select").forEach(select => select.addEventListener("change", event => {
        const request = requests.find(item => item.id === event.target.dataset.id);
        if (!request) return;
        const oldCollector = request.collector;
        request.collector = event.target.value;
        if (request.collector && request.status === "Pending") request.status = "Assigned";
        else if (!request.collector && request.status === "Assigned") request.status = "Pending";
        const message = request.collector
          ? `${oldCollector ? `Collector reassigned from ${oldCollector} to` : "Assigned to"} ${request.collector}`
          : `Unassigned from ${oldCollector}`;
        addHistory(request, message);
        save(); render(); showToast(`${request.id} assignment updated.`);
      }));
    }
    function renderTables() {
      const dashboardList = matchingRequests(document.getElementById("search-dashboard").value, document.getElementById("filter-dashboard").value);
      const requestList = matchingRequests(document.getElementById("search-requests").value, document.getElementById("filter-requests").value);
      const dashboardRows = document.getElementById("dashboard-rows");
      const requestRowsElement = document.getElementById("requests-rows");
      dashboardRows.innerHTML = requestRows(dashboardList.slice(0, 5), false);
      requestRowsElement.innerHTML = requestRows(requestList, true);
      bindTableControls(requestRowsElement);
      document.getElementById("dashboard-summary").textContent = `Showing ${Math.min(dashboardList.length, 5)} of ${requests.length} requests`;
      document.getElementById("requests-summary").textContent = `Showing ${requestList.length} of ${requests.length} requests`;
    }
    function pickupMarkup(request, compact = false) {
      const date = new Date(`${request.date}T12:00:00`);
      const dateTile = `<div class="date-tile"><strong>${date.getDate()}</strong><span>${date.toLocaleDateString(undefined, { month: "short" })}</span></div>`;
      return `<div class="pickup-item">${dateTile}<div class="pickup-info"><div class="pickup-name">${escapeHtml(request.name)}</div><div class="pickup-address">${escapeHtml(request.address)}</div><div class="pickup-time">${escapeHtml(request.window || "Time not set")} · ${escapeHtml(request.category)} (${escapeHtml(request.quantity)})</div></div>${request.collector ? `<div class="collector-dot" title="${escapeHtml(request.collector)}">${escapeHtml(initials(request.collector))}</div>` : ""}</div>`;
    }
    function renderSchedule() {
      const scheduled = requests.filter(request => request.date && !["Completed", "Cancelled"].includes(request.status)).sort((a, b) => a.date.localeCompare(b.date));
      document.getElementById("upcoming-list").innerHTML = scheduled.length
        ? scheduled.slice(0, 4).map(request => pickupMarkup(request)).join("")
        : '<div class="empty-state">No upcoming pickups scheduled.</div>';
      document.getElementById("schedule-total").textContent = `${scheduled.length} pickup${scheduled.length === 1 ? "" : "s"}`;
      document.getElementById("schedule-list").innerHTML = scheduled.length
        ? scheduled.map(request => `<article class="schedule-card">${pickupMarkup(request)}<div class="schedule-meta">${statusBadge(request.status)} <span style="margin-left:7px">${request.collector ? `Collector: ${escapeHtml(request.collector)}` : "Awaiting collector assignment"}</span></div></article>`).join("")
        : '<div class="empty-state" style="grid-column:1/-1">No upcoming pickups. Add a request to build your schedule.</div>';
    }
    function renderHistory() {
      const list = [...history].sort((a, b) => b.time.localeCompare(a.time));
      document.getElementById("history-list").innerHTML = list.length
        ? list.map(entry => `<div class="history-entry"><div class="history-mark">${historyIcon}</div><div class="history-copy"><strong>${escapeHtml(entry.name)}</strong> · ${escapeHtml(entry.message)} <span class="sub-cell">(${escapeHtml(entry.requestId)})</span><div class="history-meta">${new Date(entry.time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</div></div></div>`).join("")
        : '<div class="empty-state">Activity will appear here as requests are created and updated.</div>';
    }
    function renderNotifications() {
      const sorted = [...history].sort((a, b) => b.time.localeCompare(a.time));
      const unreadCount = sorted.filter(entry => !readNotificationIds.has(entry.id)).length;
      const countBadge = document.getElementById("notification-count");
      countBadge.hidden = unreadCount === 0;
      countBadge.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
      document.getElementById("notifications-button").setAttribute("aria-label", unreadCount
        ? `Notifications, ${unreadCount} unread`
        : "Notifications");
      document.getElementById("notifications-button").title = unreadCount
        ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
        : "Notifications";
      document.getElementById("notification-summary").textContent = unreadCount
        ? `${unreadCount} unread`
        : "All caught up";
      document.getElementById("mark-all-read").disabled = unreadCount === 0;
      document.getElementById("notification-list").innerHTML = sorted.length
        ? sorted.map(entry => {
          const unread = !readNotificationIds.has(entry.id);
          const time = new Date(entry.time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
          return `<article class="notification-item${unread ? " unread" : ""}">
            <div class="notification-mark">${historyIcon}</div>
            <div class="notification-copy"><strong>${escapeHtml(entry.requestId)} · ${escapeHtml(entry.name)}</strong><p>${escapeHtml(entry.message)}</p><div class="notification-meta">${escapeHtml(time)}</div></div>
            <span class="notification-unread-dot" aria-label="${unread ? "Unread" : "Read"}"></span>
            ${unread ? `<button class="text-button" type="button" data-mark-notification="${escapeHtml(entry.id)}" aria-label="Mark notification for ${escapeHtml(entry.requestId)} as read">Mark read</button>` : ""}
          </article>`;
        }).join("")
        : '<div class="empty-state">You’re all caught up. Updates about collection requests will appear here.</div>';
    }
    function renderFeedback() {
      document.getElementById("review-count").textContent = `${feedbackEntries.length} review${feedbackEntries.length === 1 ? "" : "s"}`;
      const sorted = [...feedbackEntries].sort((a, b) => b.time.localeCompare(a.time));
      document.getElementById("review-list").innerHTML = sorted.length
        ? sorted.map(entry => {
          const time = new Date(entry.time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
          return `<article class="review-card">
            <div class="review-card-top"><span class="review-stars" aria-label="${escapeHtml(entry.rating)} out of 5 stars">${"★".repeat(entry.rating)}${"☆".repeat(5 - entry.rating)}</span><span class="review-category">${escapeHtml(entry.topic)}</span></div>
            <p>${escapeHtml(entry.message)}</p>
            <div class="review-meta">${escapeHtml(entry.name)} · ${escapeHtml(time)}</div>
          </article>`;
        }).join("")
        : '<div class="empty-state">No reviews yet. Your feedback can help make ReWired better.</div>';
    }
    function renderIssueReports() {
      const sorted = [...issueReports].sort((a, b) => b.time.localeCompare(a.time));
      document.getElementById("issue-count").textContent = `${issueReports.length} report${issueReports.length === 1 ? "" : "s"}`;
      document.getElementById("issue-list").innerHTML = sorted.length
        ? sorted.map(report => {
          const time = new Date(report.time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
          return `<article class="issue-card">
            <div class="issue-card-main">
              <h3>${escapeHtml(report.category)}</h3>
              <div class="issue-card-location">${escapeHtml(report.location)}</div>
              <p class="issue-card-description">${escapeHtml(report.description)}</p>
              <div class="issue-card-meta">${escapeHtml(report.id)} · Saved locally · ${escapeHtml(time)}</div>
            </div>
            <span class="status assigned">Saved</span>
            ${report.photo ? `<img class="issue-card-photo" src="${report.photo}" alt="Photo attached to ${escapeHtml(report.id)}">` : ""}
          </article>`;
        }).join("")
        : '<div class="empty-state">No issues reported yet. Use the form to report garbage anywhere you spot it.</div>';
    }
    function renderSupportQueries() {
      const sorted = [...supportQueries].sort((a, b) => b.time.localeCompare(a.time));
      document.getElementById("query-count").textContent = `${supportQueries.length} quer${supportQueries.length === 1 ? "y" : "ies"}`;
      document.getElementById("query-list").innerHTML = sorted.length
        ? sorted.map(query => {
          const time = new Date(query.time).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
          const contact = [query.email, query.phone].filter(Boolean).map(escapeHtml).join(" · ");
          return `<article class="issue-card">
            <div class="issue-card-main">
              <h3>${escapeHtml(query.topic)}</h3>
              <div class="issue-card-location">${escapeHtml(query.name || "Contact request")} · ${contact}</div>
              <p class="issue-card-description">${escapeHtml(query.description)}</p>
              <div class="issue-card-meta">${escapeHtml(query.id)} · Saved locally · ${escapeHtml(time)}</div>
            </div>
            <span class="status assigned">Saved</span>
          </article>`;
        }).join("")
        : '<div class="empty-state">No queries yet. Submit the form if you need help with ReWired.</div>';
    }
    function saveSupportQuery(query) {
      supportQueries.unshift(query);
      try {
        localStorage.setItem(supportQueriesKey, JSON.stringify(supportQueries));
        return true;
      } catch (error) {
        supportQueries.shift();
        console.error("Could not save the support query.", error);
        return false;
      }
    }
    function saveIssueReport(report) {
      issueReports.unshift(report);
      try {
        localStorage.setItem(issueReportsKey, JSON.stringify(issueReports));
        return true;
      } catch (error) {
        issueReports.shift();
        console.error("Could not save the issue report.", error);
        return false;
      }
    }
    function showIssueMessage(message) {
      const messageElement = document.getElementById("issue-message");
      messageElement.textContent = message;
      messageElement.hidden = false;
    }
    function compressIssuePhoto(file) {
      return new Promise((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file);
        const image = new Image();
        image.onload = () => {
          URL.revokeObjectURL(objectUrl);
          if (image.width * image.height > 40000000) {
            reject(new Error("This photo is too large to process. Choose an image under 40 megapixels."));
            return;
          }
          const scale = Math.min(1, 1280 / Math.max(image.width, image.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));
          const context = canvas.getContext("2d");
          if (!context) {
            reject(new Error("This browser could not prepare the photo. Try another image."));
            return;
          }
          context.fillStyle = "#fff";
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          let quality = .78;
          let photo = canvas.toDataURL("image/jpeg", quality);
          while (photo.length > 1000000 && quality > .48) {
            quality -= .1;
            photo = canvas.toDataURL("image/jpeg", quality);
          }
          while (photo.length > 1000000 && canvas.width > 320 && canvas.height > 320) {
            canvas.width = Math.max(1, Math.round(canvas.width * .75));
            canvas.height = Math.max(1, Math.round(canvas.height * .75));
            context.fillStyle = "#fff";
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
            photo = canvas.toDataURL("image/jpeg", .55);
          }
          if (photo.length > 1000000) {
            reject(new Error("This photo could not be compressed enough to save. Choose a smaller image."));
            return;
          }
          resolve(photo);
        };
        image.onerror = () => {
          URL.revokeObjectURL(objectUrl);
          reject(new Error("This photo could not be opened. Choose a different image."));
        };
        image.src = objectUrl;
      });
    }
    function saveReadNotificationIds() {
      try {
        localStorage.setItem(notificationReadKey, JSON.stringify([...readNotificationIds]));
        return true;
      } catch (error) {
        console.error("Could not save notification read status.", error);
        return false;
      }
    }
    function markNotificationRead(id) {
      readNotificationIds.add(id);
      if (!saveReadNotificationIds()) showToast("Could not save notification status in this browser.");
      renderNotifications();
    }
    function saveFeedbackEntry(entry) {
      feedbackEntries.unshift(entry);
      try {
        localStorage.setItem(feedbackEntriesKey, JSON.stringify(feedbackEntries));
        return true;
      } catch (error) {
        feedbackEntries.shift();
        console.error("Could not save feedback.", error);
        return false;
      }
    }
    function renderStats() {
      const open = requests.filter(request => !["Completed", "Cancelled"].includes(request.status)).length;
      const today = requests.filter(request => request.date === localDateString(new Date()) && !["Completed", "Cancelled"].includes(request.status)).length;
      const completed = requests.filter(request => request.status === "Completed").length;
      const items = requests.filter(request => request.status === "Completed").reduce((total, request) => total + Number(request.quantity || 0), 0);
      document.getElementById("open-count").textContent = open;
      document.getElementById("today-count").textContent = today;
      document.getElementById("completed-count").textContent = completed;
      document.getElementById("items-count").textContent = items;
      document.getElementById("impact-count").textContent = items;
      document.getElementById("request-nav-count").textContent = requests.length;
    }
    function render() {
      renderStats();
      renderTables();
      renderSchedule();
      renderHistory();
      renderNotifications();
      renderFeedback();
      renderIssueReports();
      renderSupportQueries();
    }
    const viewTitles = { dashboard: "Overview", requests: "Collection requests", schedule: "Pickup schedule", history: "Collection history", notifications: "Notifications", feedback: "Feedback & reviews", issues: "Report an E-Waste Issue", queries: "Raise a query" };
    function showView(name) {
      document.querySelectorAll(".section-view").forEach(view => view.classList.toggle("active", view.id === `view-${name}`));
      document.querySelectorAll(".nav-link, .mobile-nav-link").forEach(link => link.classList.toggle("active", link.dataset.view === name));
      document.getElementById("breadcrumb-current").textContent = viewTitles[name] || viewTitles.dashboard;
    }
    function showToast(message) {
      const toast = document.getElementById("toast");
      toast.textContent = message;
      toast.classList.add("show");
      window.clearTimeout(showToast.timeout);
      showToast.timeout = window.setTimeout(() => toast.classList.remove("show"), 2600);
    }
    function showLoginMessage(message, state = "error") {
      const messageElement = document.getElementById("login-message");
      messageElement.textContent = message;
      messageElement.dataset.state = state;
      messageElement.hidden = false;
    }
    function showSignupMessage(message) {
      const messageElement = document.getElementById("signup-message");
      messageElement.textContent = message;
      messageElement.hidden = false;
    }
    function setAuthView(view) {
      const isSignup = view === "signup";
      document.getElementById("login-kicker").textContent = isSignup ? "GET STARTED" : "WELCOME BACK";
      document.getElementById("login-heading").textContent = isSignup ? "Create your ReWired account" : "Sign in to your workspace";
      document.getElementById("login-description").textContent = isSignup
        ? "Create a demo account to manage your collection dashboard."
        : "Enter your details to open the ReWired dashboard.";
      document.getElementById("auth-demo-notice").textContent = isSignup
        ? "Demo mode: use a valid email and a password of at least 8 characters. No real account or password is created or stored."
        : "Demo mode: enter your name, any valid email, and a non-empty password. This page does not verify credentials or connect to a server.";
      document.getElementById("login-form").hidden = isSignup;
      document.getElementById("signin-prompt").hidden = isSignup;
      document.getElementById("signup-panel").hidden = !isSignup;
      document.getElementById("login-message").hidden = true;
      document.getElementById("signup-message").hidden = true;
      if (isSignup) {
        document.getElementById("signup-name").value = document.getElementById("login-name").value;
        document.getElementById("signup-email").value = document.getElementById("login-email").value;
        document.getElementById("signup-name").focus();
      } else {
        document.getElementById("login-email").focus();
      }
    }
    function nameFromEmail(email) {
      const localPart = email.split("@")[0].replace(/[._+-]+/g, " ").trim();
      return localPart.replace(/\b\w/g, character => character.toUpperCase()) || "there";
    }
    function showWorkspace(email, displayName = nameFromEmail(email), animate = true) {
      const name = displayName.trim() || nameFromEmail(email);
      const loginScreen = document.getElementById("login-screen");
      const app = document.getElementById("app");
      document.getElementById("active-user-name").textContent = name;
      document.getElementById("active-user-avatar").textContent = name[0].toUpperCase();
      document.getElementById("welcome-name").textContent = name;
      app.hidden = false;
      if (!animate || loginScreen.hidden) {
        loginScreen.hidden = true;
        app.classList.remove("is-entering");
        return;
      }
      app.classList.add("is-entering");
      const finishDashboardEntry = event => {
        if (event.target !== app || event.animationName !== "dashboard-enter") return;
        app.classList.remove("is-entering");
        app.removeEventListener("animationend", finishDashboardEntry);
      };
      const finishLoginExit = event => {
        if (event.target !== loginScreen || event.animationName !== "login-exit") return;
        loginScreen.hidden = true;
        loginScreen.classList.remove("is-leaving");
        loginScreen.removeEventListener("animationend", finishLoginExit);
      };
      app.addEventListener("animationend", finishDashboardEntry);
      loginScreen.addEventListener("animationend", finishLoginExit);
      loginScreen.classList.add("is-leaving");
    }
    function storedLoginSession() {
      try {
        const storage = localStorage.getItem(loginSessionKey) ? localStorage : sessionStorage;
        const email = storage.getItem(loginSessionKey) || "";
        return { email, name: storage.getItem(loginSessionNameKey) || nameFromEmail(email) };
      } catch (error) {
        console.error("Could not restore the demo login session.", error);
        return { email: "", name: "" };
      }
    }
    function saveDemoSession(email, name, remember) {
      try {
        localStorage.removeItem(loginSessionKey);
        localStorage.removeItem(loginSessionNameKey);
        sessionStorage.removeItem(loginSessionKey);
        sessionStorage.removeItem(loginSessionNameKey);
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(loginSessionKey, email);
        storage.setItem(loginSessionNameKey, name);
        return true;
      } catch (error) {
        console.error("Could not save the demo login session.", error);
        return false;
      }
    }
    function endLoginSession() {
      let failedToClearSession = false;
      [localStorage, sessionStorage].forEach(storage => {
        try {
          storage.removeItem(loginSessionKey);
          storage.removeItem(loginSessionNameKey);
        } catch (error) {
          failedToClearSession = true;
          console.error("Could not clear the demo login session.", error);
        }
      });
      document.getElementById("app").hidden = true;
      document.getElementById("login-screen").hidden = false;
      document.getElementById("login-password").value = "";
      document.getElementById("login-message").hidden = true;
      document.getElementById("login-email").focus();
      if (failedToClearSession) showToast("Could not clear saved session data from this browser.");
    }
    function openModal() {
      document.getElementById("request-modal").classList.add("open");
      document.getElementById("customer-name").focus();
    }
    function closeModal() {
      document.getElementById("request-modal").classList.remove("open");
    }
    document.querySelectorAll(".nav-link, .mobile-nav-link").forEach(link => link.addEventListener("click", () => showView(link.dataset.view)));
    document.getElementById("notifications-button").addEventListener("click", () => showView("notifications"));
    document.getElementById("mark-all-read").addEventListener("click", () => {
      history.forEach(entry => readNotificationIds.add(entry.id));
      if (!saveReadNotificationIds()) showToast("Could not save notification status in this browser.");
      renderNotifications();
    });
    document.getElementById("notification-list").addEventListener("click", event => {
      const button = event.target.closest("[data-mark-notification]");
      if (button) markNotificationRead(button.dataset.markNotification);
    });
    document.getElementById("feedback-form").addEventListener("change", event => {
      if (event.target.name !== "rating") return;
      const rating = Number(event.target.value);
      document.querySelectorAll(".rating-option").forEach((option, index) => {
        option.classList.toggle("selected", index < rating);
      });
    });
    document.getElementById("feedback-form").addEventListener("submit", event => {
      event.preventDefault();
      const form = event.currentTarget;
      if (!form.reportValidity()) return;
      const selectedRating = form.querySelector('input[name="rating"]:checked');
      if (!selectedRating) return;
      const entry = {
        id: `${Date.now()}-${Math.random()}`,
        name: document.getElementById("active-user-name").textContent,
        rating: Number(selectedRating.value),
        topic: document.getElementById("feedback-topic").value,
        message: document.getElementById("feedback-message").value.trim(),
        time: new Date().toISOString()
      };
      if (!entry.message) {
        document.getElementById("feedback-message").focus();
        return;
      }
      if (!saveFeedbackEntry(entry)) {
        showToast("Could not save your feedback in this browser.");
        return;
      }
      form.reset();
      document.querySelectorAll(".rating-option").forEach(option => option.classList.remove("selected"));
      renderFeedback();
      showToast("Thanks for sharing your feedback!");
    });
    document.getElementById("query-form").addEventListener("submit", event => {
      event.preventDefault();
      const form = event.currentTarget;
      const emailInput = document.getElementById("query-email");
      const descriptionInput = document.getElementById("query-description");
      emailInput.value = emailInput.value.trim();
      descriptionInput.value = descriptionInput.value.trim();
      if (!form.reportValidity()) return;
      if (!descriptionInput.value) {
        descriptionInput.setCustomValidity("Describe the issue so we know how to help.");
        descriptionInput.reportValidity();
        descriptionInput.addEventListener("input", () => descriptionInput.setCustomValidity(""), { once: true });
        return;
      }
      const query = {
        id: `RQ-${Date.now()}`,
        name: document.getElementById("query-name").value.trim(),
        email: emailInput.value,
        phone: document.getElementById("query-phone").value.trim(),
        topic: document.getElementById("query-topic").value,
        description: descriptionInput.value,
        time: new Date().toISOString()
      };
      if (!saveSupportQuery(query)) {
        const message = document.getElementById("query-message");
        message.textContent = "Could not save your query in this browser. Check available storage and try again.";
        message.hidden = false;
        return;
      }
      form.reset();
      renderSupportQueries();
      const message = document.getElementById("query-message");
      message.textContent = "Your query was saved in this browser demo; it has not been sent to a support team.";
      message.hidden = false;
    });
    document.getElementById("issue-photo").addEventListener("change", async event => {
      const file = event.currentTarget.files[0];
      if (!file) return;
      if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
        event.currentTarget.value = "";
        showIssueMessage("Choose a JPG, PNG, WebP, or other raster image.");
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        event.currentTarget.value = "";
        showIssueMessage("Choose a photo smaller than 8 MB.");
        return;
      }
      isCompressingIssuePhoto = true;
      document.querySelector('#issue-report-form button[type="submit"]').disabled = true;
      selectedIssuePhoto = "";
      document.getElementById("issue-photo-preview").replaceChildren();
      document.getElementById("issue-photo-preview").hidden = true;
      try {
        selectedIssuePhoto = await compressIssuePhoto(file);
        document.getElementById("issue-photo-preview").innerHTML =
          `<img src="${selectedIssuePhoto}" alt="Preview of the attached issue photo"><button class="remove-photo-button" id="remove-issue-photo" type="button">Remove photo</button>`;
        document.getElementById("issue-photo-preview").hidden = false;
        document.getElementById("issue-message").hidden = true;
      } catch (error) {
        selectedIssuePhoto = "";
        event.currentTarget.value = "";
        document.getElementById("issue-photo-preview").replaceChildren();
        document.getElementById("issue-photo-preview").hidden = true;
        showIssueMessage(error.message);
      } finally {
        isCompressingIssuePhoto = false;
        document.querySelector('#issue-report-form button[type="submit"]').disabled = false;
      }
    });
    document.getElementById("issue-photo-preview").addEventListener("click", event => {
      if (event.target.id !== "remove-issue-photo") return;
      selectedIssuePhoto = "";
      document.getElementById("issue-photo").value = "";
      document.getElementById("issue-photo-preview").replaceChildren();
      document.getElementById("issue-photo-preview").hidden = true;
    });
    document.getElementById("use-current-location").addEventListener("click", () => {
      const locationInput = document.getElementById("issue-location");
      if (!navigator.geolocation) {
        showIssueMessage("Location access is not available in this browser. You can enter the road or area manually.");
        return;
      }
      const button = document.getElementById("use-current-location");
      button.disabled = true;
      button.textContent = "Finding location…";
      const restoreButton = () => {
        button.disabled = false;
        button.textContent = "Use my location";
      };
      const handleLocationError = error => {
        console.error("Could not get the issue location.", error);
        restoreButton();
        const message = error.code === 1
          ? "Location permission was denied. Enter the road or area manually."
          : "Could not get your location. Enter the road or area manually.";
        showIssueMessage(message);
      };
      try {
        navigator.geolocation.getCurrentPosition(position => {
          locationInput.value = `GPS: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`;
          document.getElementById("issue-message").hidden = true;
          restoreButton();
        }, handleLocationError, { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 });
      } catch (error) {
        handleLocationError(error);
      }
    });
    document.getElementById("issue-report-form").addEventListener("submit", async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const location = document.getElementById("issue-location").value.trim();
      const description = document.getElementById("issue-description").value.trim();
      if (isCompressingIssuePhoto) {
        showIssueMessage("Please wait for the photo to finish preparing.");
        return;
      }
      if (!location || !description || !form.reportValidity()) {
        if (!location) showIssueMessage("Add the road, area, landmark, or coordinates for this issue.");
        else if (!description) showIssueMessage("Describe the garbage collection issue.");
        return;
      }
      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      const report = {
        id: `RI-${Date.now()}`,
        location,
        category: document.getElementById("issue-category").value,
        description,
        photo: selectedIssuePhoto,
        time: new Date().toISOString()
      };
      const saved = saveIssueReport(report);
      submitButton.disabled = false;
      if (!saved) {
        showIssueMessage("Could not save this report in your browser. Try removing the photo or using a smaller one.");
        return;
      }
      form.reset();
      selectedIssuePhoto = "";
      document.getElementById("issue-photo-preview").replaceChildren();
      document.getElementById("issue-photo-preview").hidden = true;
      document.getElementById("issue-message").hidden = true;
      renderIssueReports();
      showToast("Issue saved in this browser.");
    });
    document.getElementById("show-signup").addEventListener("click", () => setAuthView("signup"));
    document.getElementById("show-signin").addEventListener("click", () => setAuthView("signin"));
    document.getElementById("login-form").addEventListener("submit", event => {
      event.preventDefault();
      const form = event.currentTarget;
      const name = document.getElementById("login-name").value.trim();
      if (!name) {
        showLoginMessage("Enter your name to continue.");
        document.getElementById("login-name").focus();
        return;
      }
      if (!form.reportValidity()) return;

      const email = document.getElementById("login-email").value.trim().toLowerCase();
      const remember = document.getElementById("remember-session").checked;
      const sessionSaved = saveDemoSession(email, name, remember);
      showWorkspace(email, name);
      if (!sessionSaved) showToast("Signed in for this page only; the browser could not save your session.");
    });
    document.getElementById("signup-form").addEventListener("submit", event => {
      event.preventDefault();
      const form = event.currentTarget;
      const name = document.getElementById("signup-name").value.trim();
      const email = document.getElementById("signup-email").value.trim().toLowerCase();
      const password = document.getElementById("signup-password");
      const confirmPassword = document.getElementById("signup-confirm-password");
      password.setCustomValidity("");
      confirmPassword.setCustomValidity("");
      if (!name) {
        showSignupMessage("Enter your name to continue.");
        document.getElementById("signup-name").focus();
        return;
      }
      if (password.value !== confirmPassword.value) {
        confirmPassword.setCustomValidity("Passwords do not match.");
        showSignupMessage("Your passwords do not match.");
        confirmPassword.reportValidity();
        return;
      }
      if (!form.reportValidity()) return;

      const remember = document.getElementById("signup-remember-session").checked;
      const sessionSaved = saveDemoSession(email, name, remember);
      showWorkspace(email, name);
      if (!sessionSaved) showToast("Demo account created for this page only; the browser could not save your session.");
    });
    document.querySelectorAll("#signup-password, #signup-confirm-password").forEach(input => {
      input.addEventListener("input", () => {
        document.getElementById("signup-confirm-password").setCustomValidity("");
        document.getElementById("signup-message").hidden = true;
      });
    });
    document.getElementById("password-toggle").addEventListener("click", event => {
      const password = document.getElementById("login-password");
      const isVisible = password.type === "text";
      password.type = isVisible ? "password" : "text";
      event.currentTarget.textContent = isVisible ? "Show" : "Hide";
      event.currentTarget.setAttribute("aria-pressed", String(!isVisible));
    });
    document.getElementById("forgot-password").addEventListener("click", () => {
      showLoginMessage("Password recovery is not available in this browser-only demo. Connect an authentication service to enable it.", "info");
    });
    document.querySelectorAll("#logout-button, #mobile-logout").forEach(button => button.addEventListener("click", endLoginSession));
    document.querySelectorAll("[data-go]").forEach(link => link.addEventListener("click", () => showView(link.dataset.go)));
    document.querySelectorAll(".new-request").forEach(button => button.addEventListener("click", openModal));
    document.querySelectorAll("#search-dashboard, #filter-dashboard, #search-requests, #filter-requests").forEach(control => {
      control.addEventListener("input", renderTables);
      control.addEventListener("change", renderTables);
    });
    document.getElementById("close-modal").addEventListener("click", closeModal);
    document.getElementById("cancel-modal").addEventListener("click", closeModal);
    document.getElementById("request-modal").addEventListener("click", event => {
      if (event.target.id === "request-modal") closeModal();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeModal();
    });
    document.getElementById("request-form").addEventListener("submit", event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const name = form.get("name").trim();
      const date = form.get("date");
      if (!name || !date) return;
      const collector = form.get("collector");
      const request = {
        id: `EW-${String(Math.max(1048, ...requests.map(item => Number(item.id.split("-")[1]) || 0)) + 1)}`,
        name, phone: form.get("phone").trim(), address: form.get("address").trim(),
        category: form.get("category"), quantity: Number(form.get("quantity")),
        date, window: form.get("window"), collector,
        status: collector ? "Assigned" : "Pending", notes: form.get("notes").trim()
      };
      requests.unshift(request);
      addHistory(request, "Collection request created");
      save();
      event.currentTarget.reset();
      document.getElementById("pickup-date").value = offsetDate(1);
      closeModal();
      render();
      showView("requests");
      showToast(`${request.id} created successfully.`);
    });
    document.getElementById("today-label").textContent = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    document.getElementById("pickup-date").min = localDateString(new Date());
    document.getElementById("pickup-date").value = offsetDate(1);
    const savedLoginSession = storedLoginSession();
    if (savedLoginSession.email) showWorkspace(savedLoginSession.email, savedLoginSession.name, false);
    render();
