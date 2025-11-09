import { browser } from "$app/environment";
import { dashboardsRepo, Database } from "$lib/db";

export const load = async () => {
    if (browser) {
        const db = (await Database.getInstance()).db;
        return {
            dashboards: db ? (await dashboardsRepo.getAllDashboards(db)) : []
        }
    }
    return {
        dashboards: []
    }
}