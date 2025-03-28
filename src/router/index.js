import { createRouter, createWebHashHistory } from "vue-router";

const routes = [
    {
        path: "/",
        name: "App",
        component: () => import("@/App.vue"),
        redirect: { name: "Main" },
        children: [
            {
                path: "main",
                name: "Main",
                component: () => import("@/views/Main.vue"),
            },
        ]
    },
];

const router = createRouter({
    history: createWebHashHistory(),
    routes,
});

export default router;
