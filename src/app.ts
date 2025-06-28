import { buildApplication, buildRouteMap } from "@stricli/core";
import { buildInstallCommand, buildUninstallCommand } from "@stricli/auto-complete";
import { name, version, description } from "../package.json";
import { subdirCommand } from "./commands/subdir/command";
import { nestedRoutes } from "./commands/nested/commands";
import { uiCommand } from "./commands/ui";

const routes = buildRouteMap({
    ...uiCommand,
    routes: {
        subdir: subdirCommand,
        nested: nestedRoutes,
        install: buildInstallCommand("chatbot-tui", { bash: "__chatbot-tui_bash_complete" }),
        uninstall: buildUninstallCommand("chatbot-tui", { bash: true }),
    },
    docs: {
        brief: description,
        hideRoute: {
            install: true,
            uninstall: true,
        },
    },
});

export const app = buildApplication(routes, {
    name,
    versionInfo: {
        currentVersion: version,
    },
});
