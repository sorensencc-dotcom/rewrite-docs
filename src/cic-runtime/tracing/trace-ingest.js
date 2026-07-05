// Assuming pgQuery exists for db access
import { pgQuery } from '../audit-log/postgres-client';
export async function ingestTrace(runId, trace) {
    console.log(`[TraceIngest] Persisting trace for run ${runId}`);
    // Update cic_audit_log with the JSONB fields
    const query = `
    UPDATE cic_audit_log
    SET 
      network_trace_json = $1::jsonb,
      syscall_trace_json = $2::jsonb,
      file_access_json = $3::jsonb
    WHERE run_id = $4
  `;
    const values = [
        JSON.stringify(trace.networkTrace),
        JSON.stringify(trace.syscallTrace),
        JSON.stringify(trace.fileAccess),
        runId
    ];
    try {
        await pgQuery(query, values);
        // Optional: ingest into dedicated tables
        for (const netEvent of trace.networkTrace) {
            await pgQuery(`
        INSERT INTO cic_network_trace (run_id, timestamp, dest_ip, dest_port, protocol, bytes_sent, bytes_received)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
                runId, netEvent.timestamp, netEvent.dest_ip, netEvent.dest_port,
                netEvent.protocol, netEvent.bytes_sent, netEvent.bytes_received
            ]);
        }
        for (const sysEvent of trace.syscallTrace) {
            await pgQuery(`
        INSERT INTO cic_syscall_trace (run_id, timestamp, syscall, result, error_code, args_json)
        VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      `, [
                runId, sysEvent.timestamp, sysEvent.syscall,
                sysEvent.result, sysEvent.error_code, sysEvent.args_json
            ]);
        }
    }
    catch (err) {
        console.error(`[TraceIngest] Failed to ingest trace for ${runId}:`, err);
        throw err;
    }
}
//# sourceMappingURL=trace-ingest.js.map