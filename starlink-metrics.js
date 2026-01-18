module.exports = function(RED) {
  function StarlinkMiniMetricsNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    const outputProperty = (config.outputProperty || "payload").trim();
    const strict = config.strict !== false;
    const includeIdentity = config.includeIdentity !== false;

    function mbps(bps) {
      if (bps === null || bps === undefined || Number.isNaN(Number(bps))) return 0;
      return Number((Number(bps) / 1_000_000).toFixed(3));
    }

    function formatDuration(sec) {
      if (!sec || Number.isNaN(Number(sec))) return "0s";
      sec = Number(sec);
      const days = Math.floor(sec / 86400);
      sec %= 86400;
      const hours = Math.floor(sec / 3600);
      sec %= 3600;
      const mins = Math.floor(sec / 60);
      const secs = Math.floor(sec % 60);
      const parts = [];
      if (days) parts.push(`${days}d`);
      if (hours) parts.push(`${hours}h`);
      if (mins) parts.push(`${mins}m`);
      if (secs) parts.push(`${secs}s`);
      return parts.length ? parts.join(" ") : "0s";
    }

    function setByPath(obj, path, value) {
      const parts = path.split(".");
      let cur = obj;
      for (let i = 0; i < parts.length - 1; i++) {
        const k = parts[i];
        if (typeof cur[k] !== "object" || cur[k] === null) cur[k] = {};
        cur = cur[k];
      }
      cur[parts[parts.length - 1]] = value;
    }

    node.on("input", function(msg, send, done) {
      try {
        let p = msg.payload;

        if (typeof p === "string") {
          try { p = JSON.parse(p); }
          catch (e) {
            if (strict) return done(); // drop
            node.warn(`Failed to parse payload as JSON: ${e.message}`);
            return done();
          }
        }

        if (!p || !p.status) {
          if (strict) return done(); // drop
          node.warn("No 'status' field found in payload");
          return done();
        }

        const s = p.status || {};
        const devInfo = s.device_info || {};
        const devState = s.device_state || {};
        const obst = s.obstruction_stats || {};
        const gps = s.gps_stats || {};
        const alerts = s.alerts || {};
        const ready = s.ready_states || {};
        const swstats = s.software_update_stats || {};
        const align = s.alignment_stats || {};
        const initDur = s.initialization_duration_seconds || {};

        const out = {
          stable_connection: initDur.stable_connection ?? null,
          software_update_state: s.software_update_state ?? null,
          class_of_service: s.class_of_service ?? null,
          mobility_class: s.mobility_class ?? null,
          gps_valid: gps.gps_valid ?? null,
          gps_sats: gps.gps_sats ?? null,
          downlink_mbps: mbps(s.downlink_throughput_bps),
          uplink_mbps: mbps(s.uplink_throughput_bps),
          pop_ping_latency_ms: s.pop_ping_latency_ms ?? null,

          roaming: alerts.roaming ?? null,
          install_pending: alerts.install_pending ?? null,
          eth_speed_mbps: s.eth_speed_mbps ?? null,
          snr_above_noise_floor: s.is_snr_above_noise_floor ?? null,

          hardware_version: devInfo.hardware_version ?? null,
          software_version: devInfo.software_version ?? null,
          generation_number: devInfo.generation_number ?? null,
          uptime_s: devState.uptime_s ? Number(devState.uptime_s) : null,

          bootcount: devInfo.bootcount ?? null,

          obstruction_valid_s: obst.valid_s ?? null,
          obstruction_valid_friendly: obst.valid_s != null ? formatDuration(obst.valid_s) : null,
          obstruction_patches_valid: obst.patches_valid ?? null,
          obstruction_avg_prolonged_interval_s: obst.avg_prolonged_obstruction_interval_s ?? null,

          boresight_azimuth_deg: s.boresight_azimuth_deg ?? align.boresight_azimuth_deg ?? null,
          boresight_elevation_deg: s.boresight_elevation_deg ?? align.boresight_elevation_deg ?? null,
          tilt_angle_deg: align.tilt_angle_deg ?? null,
          attitude_estimation_state: align.attitude_estimation_state ?? null,
          attitude_uncertainty_deg: align.attitude_uncertainty_deg ?? null,
          desired_boresight_azimuth_deg: align.desired_boresight_azimuth_deg ?? null,
          desired_boresight_elevation_deg: align.desired_boresight_elevation_deg ?? null,

          sw_update_progress: swstats.software_update_progress ?? null,

          has_actuators: s.has_actuators ?? align.has_actuators ?? null,
          disablement_code: s.disablement_code ?? null,
          has_signed_cals: s.has_signed_cals ?? null,

          ready_scp: ready.scp ?? null,
          ready_l1l2: ready.l1l2 ?? null,
          ready_xphy: ready.xphy ?? null,
          ready_aap: ready.aap ?? null,
          ready_rf: ready.rf ?? null
        };

        if (includeIdentity) {
          out.ts = p.ts;
          out.dish_id = p.dish_id;
          out.serial = p.serial;
        }

        setByPath(msg, outputProperty, out);
        send(msg);
        done();
      } catch (err) {
        done(err);
      }
    });
  }

  RED.nodes.registerType("starlink-mini-metrics", StarlinkMiniMetricsNode);
};

