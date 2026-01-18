# node-red-contrib-starlink-mini-metrics

A Node-RED node that extracts and normalizes advanced metrics from a Starlink Mini `raw_status` payload.

This node is designed to consume messages published to MQTT (commonly `starlink/mini/raw_status`) and output a flattened metrics object suitable for dashboards, alerts, and storage (InfluxDB, files, etc.).

## Install

From Node-RED Palette Manager, or:

```bash
npm install node-red-contrib-starlink-mini-metrics
```

Restart Node-RED.

## Usage

Typical flow:

**mqtt in** (`starlink/mini/raw_status`) → **starlink mini metrics** → debug/dashboard/storage

The node accepts:
- `msg.payload` as an object, or
- `msg.payload` as a JSON string

If `Strict` is enabled (default), messages missing `payload.status` are dropped.

## Output

By default, output is written to `msg.payload`:

- `downlink_mbps`, `uplink_mbps`
- `pop_ping_latency_ms`
- GPS, obstruction, alignment/boresight fields
- ready state flags
- (optional) `ts`, `dish_id`, `serial`

## Configuration

- **Output property**: where to write the metrics object (default: `payload`)
- **Strict**: drop message if missing `status` (default: true)
- **Identity fields**: include `ts`, `dish_id`, `serial` if present (default: true)

## Example flow

See `examples/flow.json` for an importable demo.

## Companion Bridge (MQTT Publisher)

This node expects the Starlink Mini status schema commonly published by a bridge that polls the Starlink dish and publishes `raw_status` to MQTT.

Companion Python bridge (Docker/systemd friendly):
- https://github.com/n3bkv/starlink-mini-mqtt-bridge

## License

MIT


## Support This Project
If you find this useful, star ⭐ the repo! It helps others discover it.

## More Info
Blog: https://hamradiohacks.blogspot.com

GitHub: https://github.com/n3bkv
