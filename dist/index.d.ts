import { type ReportOptions } from "./utils/reporter.js";
import { AxeResults, Result } from "axe-core";
interface AccessibilityOptions extends ReportOptions {
    waitForHydration?: boolean;
    ajaxTimeout?: number;
    routeChanges?: boolean;
    testIslands?: boolean;
    frameworks?: string[];
    strict?: boolean;
}
declare function checkStaticHTML(filePath: string, options?: ReportOptions): Promise<{
    violations: Result[];
}>;
declare function checkAccessibility(url: string, options?: AccessibilityOptions): Promise<AxeResults>;
export { checkAccessibility, checkStaticHTML, type AccessibilityOptions };
