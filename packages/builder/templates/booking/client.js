(function () {
  var $ = function (id) { return document.getElementById(id); };
  var list = $("list"), msg = $("msg"), count = $("count"), form = $("f"), body = document.body;
  async function refresh() {
    var r = await fetch("/api/bookings");
    var items = await r.json();
    list.replaceChildren();
    count.textContent = String(items.length);
    if (items.length === 0) {
      var e = document.createElement("li");
      e.textContent = body.dataset.empty;
      list.append(e);
      return;
    }
    items.forEach(function (b) {
      var li = document.createElement("li");
      li.textContent = b.customer + " \u2014 " + b.date + " " + b.time;
      list.append(li);
    });
  }
  form.addEventListener("submit", async function (ev) {
    ev.preventDefault();
    var fd = new FormData(form);
    var payload = { customer: fd.get("customer"), date: fd.get("date"), time: fd.get("time") };
    var r = await fetch("/api/bookings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    if (!r.ok) { msg.textContent = body.dataset.error; return; }
    msg.textContent = "";
    form.reset();
    await refresh();
  });
  refresh();
})();
