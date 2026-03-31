// Types taken from https://stackoverflow.com/a/67171375/3861550

declare global {
    interface Window {
        __PWA_INITIALIZED__?: boolean
    }

    interface WindowEventMap {
        beforeinstallprompt: BeforeInstallPromptEvent
    }
}

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[]
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed'
        platform: string
    }>
    prompt(): Promise<void>
}

interface UsePwaOptions {
    /** Interval in milliseconds for refreshing the PWA cache (default: 900000) */
    refreshIntervalMs?: number | null
    /** Initial delay in milliseconds before the first refresh (default: 10000) */
    initialRefreshDelayMs?: number | null
    /** Tag for periodic sync events (default: 'inertia-refresh') */
    periodicSyncTag?: string
    /** URL for checking online status (default: '/') */
    onlineCheckUrl?: string
}

export type { BeforeInstallPromptEvent, UsePwaOptions }