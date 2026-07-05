type SinkFn = (entry: any) => void;
interface AdapterLogger {
    _setSink(sink: SinkFn | null): void;
    info(entry: any): void;
    warn(entry: any): void;
    debug(entry: any): void;
    error(entry: any): void;
}
export declare const adapterLogger: AdapterLogger;
export {};
//# sourceMappingURL=adapterLogger.d.ts.map