interface AstroConfig {
    server?: {
        host?: string;
        port?: number;
    };
}
interface AstroAccessibilityOptions {
    enableDevChecks?: boolean;
    enableBuildChecks?: boolean;
    failOnErrors?: boolean;
    forceBuild?: boolean;
    checkInterval?: number;
}
interface AstroBuildPage {
    pathname: string;
}
interface AstroBuildDoneEvent {
    config: AstroConfig;
    pages: AstroBuildPage[];
}
interface AstroServerSetupEvent {
    server: any;
    config: AstroConfig;
}
declare function astroAccessibility(options?: AstroAccessibilityOptions): {
    name: string;
    hooks: {
        'astro:server:setup': ({ server, config }: AstroServerSetupEvent) => Promise<void>;
        'astro:build:done': ({ config, pages }: AstroBuildDoneEvent) => Promise<void>;
    };
};
export default astroAccessibility;
