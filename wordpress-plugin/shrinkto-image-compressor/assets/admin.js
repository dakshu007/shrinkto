/* ShrinkTo admin: per-image compress buttons + bulk optimizer loop. */
(function () {
	"use strict";

	var cfg = window.ShrinkToAdmin || {};

	function post(action, data) {
		var body = new FormData();
		body.append("action", action);
		body.append("nonce", cfg.nonce);
		Object.keys(data || {}).forEach(function (k) {
			body.append(k, data[k]);
		});
		return fetch(cfg.ajaxUrl, { method: "POST", credentials: "same-origin", body: body }).then(function (r) {
			return r.json();
		});
	}

	// ---- Media list: single-image compress ------------------------------------
	document.addEventListener("click", function (e) {
		var btn = e.target.closest(".shrinkto-compress-one");
		if (!btn) return;
		btn.disabled = true;
		btn.textContent = "Compressing…";
		post("shrinkto_compress_one", { id: btn.dataset.id }).then(function (res) {
			if (res && res.success) {
				var span = document.createElement("span");
				span.className = "shrinkto-done";
				span.textContent = "✓ " + res.data.saved + " (−" + res.data.pct + "%)";
				btn.replaceWith(span);
			} else {
				btn.textContent = (res && res.data && res.data.message) || "Failed";
			}
		});
	});

	// ---- Bulk optimizer ---------------------------------------------------------
	var startBtn = document.getElementById("shrinkto-bulk-start");
	if (!startBtn) return;

	var stopBtn = document.getElementById("shrinkto-bulk-stop");
	var progress = document.getElementById("shrinkto-bulk-progress");
	var fill = progress ? progress.querySelector(".shrinkto-bar-fill") : null;
	var status = document.getElementById("shrinkto-bulk-status");
	var running = false;
	var doneCount = 0;
	var totalCount = 0;

	function tick() {
		if (!running) return;
		post("shrinkto_bulk_next", {}).then(function (res) {
			if (!res || !res.success) {
				status.textContent = (res && res.data && res.data.message) || "Something went wrong.";
				finish();
				return;
			}
			doneCount += res.data.processed;
			if (!totalCount) totalCount = doneCount + res.data.remaining;
			var pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 100;
			if (fill) fill.style.width = pct + "%";
			status.textContent =
				doneCount + " / " + totalCount + " images · total saved: " + res.data.total_saved;
			if (res.data.remaining > 0 && res.data.processed > 0) {
				tick();
			} else {
				status.textContent = "Done! " + status.textContent;
				finish();
			}
		});
	}

	function finish() {
		running = false;
		startBtn.disabled = false;
		stopBtn.disabled = true;
	}

	startBtn.addEventListener("click", function () {
		running = true;
		doneCount = 0;
		totalCount = 0;
		startBtn.disabled = true;
		stopBtn.disabled = false;
		progress.hidden = false;
		if (fill) fill.style.width = "0%";
		status.textContent = "Starting…";
		tick();
	});

	stopBtn.addEventListener("click", function () {
		running = false;
		status.textContent += " (stopped)";
		finish();
	});
})();
