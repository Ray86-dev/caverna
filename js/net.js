/* Canal en tiempo real (Supabase Realtime, solo "broadcast": no se guarda nada en ninguna base de datos). */
(function () {
  var URL_ = 'https://kicpndzbcswxchxiejje.supabase.co';
  var KEY = 'sb_publishable_0gVpzouxR1ZUcPf7zU8ELg_MFXgm3K4';

  window.Net = {
    status: 'off',
    onStatus: null,
    _ch: null,
    _handlers: {},
    connect: function (room) {
      var self = this;
      try {
        if (!window.supabase) throw new Error('lib');
        this._client = window.supabase.createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false }, realtime: { params: { eventsPerSecond: 20 } } });
        var ch = this._client.channel('caverna-' + room, { config: { broadcast: { self: false, ack: false } } });
        Object.keys(this._handlers).forEach(function (ev) { ch.on('broadcast', { event: ev }, function (m) { self._handlers[ev](m.payload); }); });
        ch.subscribe(function (st) {
          self._set(st === 'SUBSCRIBED' ? 'on' : (st === 'CLOSED' ? 'off' : 'wait'));
        });
        this._ch = ch;
        this._set('wait');
      } catch (e) { this._set('off'); }
    },
    _set: function (s) { if (s !== this.status) { this.status = s; if (this.onStatus) this.onStatus(s); } },
    on: function (ev, fn) { this._handlers[ev] = fn; },
    send: function (ev, payload) {
      if (!this._ch || this.status !== 'on') return false;
      try { this._ch.send({ type: 'broadcast', event: ev, payload: payload }); return true; } catch (e) { return false; }
    }
  };
})();
