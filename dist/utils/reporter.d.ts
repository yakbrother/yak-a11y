import { AxeResults } from 'axe-core';
interface ReportOptions {
    verbose?: boolean;
}
declare function generateReport(results: AxeResults | null, options?: ReportOptions): Promise<void>;
export { generateReport, type ReportOptions };
